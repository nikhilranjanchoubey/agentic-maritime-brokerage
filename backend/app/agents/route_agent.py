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

        # Find routes matching origin and destination
        matching_routes = self.routes[
            (self.routes["origin"].str.lower() == origin.lower())
            &
            (self.routes["destination"].str.lower() == destination.lower())
        ].copy()

        # If no route exists
        if matching_routes.empty:
            return {
                "message": "No route found for the given origin & destination"
            }

        # Find the route with the shortest transit time
        best_route = matching_routes.sort_values(
            "transit_days"
        ).iloc[0]

        return {
            "status": "success",
            "origin": origin,
            "destination": destination,
            "cargo_type": cargo_type,
            "containers": containers,
            "transit_time_days": int(
                best_route["transit_days"]
            ),
            "distance_nm": int(
                best_route["distance_nm"]
            )
        }