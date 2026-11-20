import pandas as pd
import os
from pathlib import Path


class RouteAgent:

    def __init__(self, project_root="."):
        # Robustly locate routes.csv across different working directories
        possible_paths = [
            os.path.join(project_root, "app", "data", "routes.csv"),
            os.path.join(os.path.dirname(__file__), "..", "data", "routes.csv"),
            os.path.join("backend", "app", "data", "routes.csv"),
            os.path.join(".", "app", "data", "routes.csv")
        ]

        self.dataset_path = None
        for p in possible_paths:
            if os.path.exists(p):
                self.dataset_path = os.path.abspath(p)
                break

        if not self.dataset_path:
            self.dataset_path = os.path.abspath(
                os.path.join(project_root, "app", "data", "routes.csv")
            )

        self.reload_routes()

    def reload_routes(self):
        """Reload routes dataset from disk with automatic delimiter detection."""
        if os.path.exists(self.dataset_path):
            self.routes = pd.read_csv(self.dataset_path, sep=None, engine="python")
            # Clean string columns in case of whitespace
            for col in ["origin", "destination", "route_type", "route_id"]:
                if col in self.routes.columns:
                    self.routes[col] = self.routes[col].astype(str).str.strip()
        else:
            self.routes = pd.DataFrame(columns=[
                "route_id", "origin", "destination", "distance_nm",
                "transit_days", "transshipments", "route_type", "base_freight_usd"
            ])

    def get_available_origins(self):
        """Return sorted list of distinct origin ports in routes dataset."""
        if "origin" in self.routes.columns:
            return sorted(self.routes["origin"].dropna().unique().tolist())
        return []

    def get_available_destinations(self, origin: str):
        """Return sorted list of available destinations for a specific origin port."""
        if "origin" in self.routes.columns and "destination" in self.routes.columns:
            origin_clean = str(origin).strip().lower()
            filtered = self.routes[self.routes["origin"].str.lower() == origin_clean]
            return sorted(filtered["destination"].dropna().unique().tolist())
        return []

    def analyze_route(
        self,
        origin,
        destination,
        cargo_type,
        containers
    ):
        origin_clean = str(origin).strip().lower()
        destination_clean = str(destination).strip().lower()

        # Step 1: Find matching routes
        matching_routes = self.routes[
            (self.routes["origin"].str.lower() == origin_clean)
            &
            (self.routes["destination"].str.lower() == destination_clean)
        ].copy()

        # If no route exists
        if matching_routes.empty:
            return {
                "status": "error",
                "message": "No matching route is currently available for this port combination."
            }

        # Step 2: Calculate transit score
        # Shorter transit time receives a higher score
        def calculate_score(series):
            maximum = series.max()
            minimum = series.min()

            if maximum == minimum:
                return pd.Series(100.0, index=series.index)

            return (
                (maximum - series) /
                (maximum - minimum)
            ) * 100

        matching_routes["transit_score"] = calculate_score(
            matching_routes["transit_days"]
        )

        # Step 3: Calculate distance score
        matching_routes["distance_score"] = calculate_score(
            matching_routes["distance_nm"]
        )

        # Step 4: Calculate transshipment score
        matching_routes["transshipment_score"] = calculate_score(
            matching_routes["transshipments"]
        )

        # Step 5: Individual route scores are ready

        # Step 6: Calculate overall route score
        matching_routes["route_score"] = (
            matching_routes["transit_score"] * 0.40
            +
            matching_routes["distance_score"] * 0.25
            +
            matching_routes["transshipment_score"] * 0.35
        )

        # Step 7: Sort routes by overall score
        matching_routes = matching_routes.sort_values(
            "route_score",
            ascending=False
        )

        # Select best route
        best_route = matching_routes.iloc[0]

        # Step 8: Prepare alternative routes
        alternatives = []

        for _, route in matching_routes.iloc[1:].iterrows():
            alternatives.append({
                "route_id": str(route["route_id"]),
                "route_type": str(route["route_type"]),
                "transit_days": int(route["transit_days"]),
                "distance_nm": int(route["distance_nm"]),
                "transshipments": int(route["transshipments"]),
                "base_freight_usd": float(route["base_freight_usd"]) if "base_freight_usd" in route else 0.0,
                "route_score": round(
                    float(route["route_score"]),
                    2
                ),
                "transit_score": round(float(route["transit_score"]), 2),
                "distance_score": round(float(route["distance_score"]), 2),
                "transshipment_score": round(float(route["transshipment_score"]), 2)
            })

        # Step 9: Return recommendation
        base_freight = float(best_route["base_freight_usd"])
        total_freight = round(base_freight * max(1, int(containers)), 2)

        return {
            "status": "success",
            "origin": origin,
            "destination": destination,
            "cargo_type": cargo_type,
            "containers": int(containers),

            "recommended_route": {
                "route_id": str(best_route["route_id"]),
                "route_type": str(best_route["route_type"]),
                "transit_days": int(best_route["transit_days"]),
                "distance_nm": int(best_route["distance_nm"]),
                "transshipments": int(best_route["transshipments"]),
                "base_freight_usd": base_freight,
                "total_freight_usd": total_freight,
                "route_score": round(
                    float(best_route["route_score"]),
                    2
                ),
                "transit_score": round(float(best_route["transit_score"]), 2),
                "distance_score": round(float(best_route["distance_score"]), 2),
                "transshipment_score": round(float(best_route["transshipment_score"]), 2)
            },

            "alternative_routes": alternatives,

            "reason": (
                "Route recommended based on weighted transit (40%), "
                "distance (25%) and transshipment (35%) scores."
            )
        }
