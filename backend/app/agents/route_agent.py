import pandas as pd
import os


class RouteAgent:

    def __init__(self, project_root):

        # Location of our route dataset
        self.dataset_path = os.path.join(
            project_root,
            "app",
            "data",
            "routes.csv"
        )

        # Load route dataset
        self.routes = pd.read_csv(self.dataset_path)

    def analyze_route(
        self,
        origin,
        destination,
        cargo_type,
        containers
    ):

        # Step 1: Find matching routes
        matching_routes = self.routes[
            (self.routes["origin"].str.lower() == origin.lower())
            &
            (self.routes["destination"].str.lower() == destination.lower())
        ].copy()

        # If no route exists
        if matching_routes.empty:
            return {
                "status": "error",
                "message": "No route found for the given origin and destination"
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
                "route_id": route["route_id"],
                "route_type": route["route_type"],
                "transit_days": int(route["transit_days"]),
                "distance_nm": int(route["distance_nm"]),
                "transshipments": int(route["transshipments"]),
                "route_score": round(
                    float(route["route_score"]),
                    2
                )
            })

        # Step 9: Return recommendation
        return {
            "status": "success",
            "origin": origin,
            "destination": destination,
            "cargo_type": cargo_type,
            "containers": containers,

            "recommended_route": {
                "route_id": best_route["route_id"],
                "route_type": best_route["route_type"],
                "transit_days": int(best_route["transit_days"]),
                "distance_nm": int(best_route["distance_nm"]),
                "transshipments": int(best_route["transshipments"]),
                "base_freight_usd": float(
                    best_route["base_freight_usd"]
                ),
                "route_score": round(
                    float(best_route["route_score"]),
                    2
                )
            },

            "alternative_routes": alternatives,

            "reason": (
                "Route recommended based on weighted transit, "
                "distance and transshipment scores."
            )
        }