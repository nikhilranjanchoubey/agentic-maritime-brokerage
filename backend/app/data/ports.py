"""
Master Ports Dataset with UN/LOCODE, Country, Region, and Coordinates.
Covers all 47 ports in the existing maritime routing dataset and major trade hubs.
"""

PORTS_DATA = [
    {
        "id": "chennai",
        "name": "Chennai",
        "country": "India",
        "code": "INMAA",
        "region": "South Asia",
        "lat": 13.0827,
        "lng": 80.2707
    },
    {
        "id": "rotterdam",
        "name": "Rotterdam",
        "country": "Netherlands",
        "code": "NLRTM",
        "region": "North Europe",
        "lat": 51.9244,
        "lng": 4.4777
    },
    {
        "id": "singapore",
        "name": "Singapore",
        "country": "Singapore",
        "code": "SGSIN",
        "region": "Southeast Asia",
        "lat": 1.29027,
        "lng": 103.851959
    },
    {
        "id": "mumbai",
        "name": "Mumbai",
        "country": "India",
        "code": "INBOM",
        "region": "South Asia",
        "lat": 18.9438,
        "lng": 72.8387
    },
    {
        "id": "nhava-sheva",
        "name": "Nhava Sheva",
        "country": "India",
        "code": "INNSA",
        "region": "South Asia",
        "lat": 18.9500,
        "lng": 72.9500
    },
    {
        "id": "shanghai",
        "name": "Shanghai",
        "country": "China",
        "code": "CNSHA",
        "region": "East Asia",
        "lat": 31.2304,
        "lng": 121.4737
    },
    {
        "id": "los-angeles",
        "name": "Los Angeles",
        "country": "United States",
        "code": "USLAX",
        "region": "North America West Coast",
        "lat": 33.7432,
        "lng": -118.2673
    },
    {
        "id": "hamburg",
        "name": "Hamburg",
        "country": "Germany",
        "code": "DEHAM",
        "region": "North Europe",
        "lat": 53.5511,
        "lng": 9.9937
    },
    {
        "id": "jebel-ali",
        "name": "Jebel Ali",
        "country": "United Arab Emirates",
        "code": "AEJEA",
        "region": "Middle East",
        "lat": 24.9857,
        "lng": 55.0273
    },
    {
        "id": "colombo",
        "name": "Colombo",
        "country": "Sri Lanka",
        "code": "LKCMB",
        "region": "South Asia",
        "lat": 6.9271,
        "lng": 79.8612
    },
    {
        "id": "antwerp",
        "name": "Antwerp",
        "country": "Belgium",
        "code": "BEANR",
        "region": "North Europe",
        "lat": 51.2194,
        "lng": 4.4025
    },
    {
        "id": "auckland",
        "name": "Auckland",
        "country": "New Zealand",
        "code": "NZAKL",
        "region": "Oceania",
        "lat": -36.8485,
        "lng": 174.7633
    },
    {
        "id": "barcelona",
        "name": "Barcelona",
        "country": "Spain",
        "code": "ESBCN",
        "region": "Mediterranean",
        "lat": 41.3879,
        "lng": 2.1699
    },
    {
        "id": "buenos-aires",
        "name": "Buenos Aires",
        "country": "Argentina",
        "code": "ARBUE",
        "region": "South America East Coast",
        "lat": -34.6037,
        "lng": -58.3816
    },
    {
        "id": "busan",
        "name": "Busan",
        "country": "South Korea",
        "code": "KRPUS",
        "region": "East Asia",
        "lat": 35.1796,
        "lng": 129.0756
    },
    {
        "id": "callao",
        "name": "Callao",
        "country": "Peru",
        "code": "PECAL",
        "region": "South America West Coast",
        "lat": -12.0565,
        "lng": -77.1181
    },
    {
        "id": "cape-town",
        "name": "Cape Town",
        "country": "South Africa",
        "code": "ZACPT",
        "region": "Southern Africa",
        "lat": -33.9249,
        "lng": 18.4241
    },
    {
        "id": "dammam",
        "name": "Dammam",
        "country": "Saudi Arabia",
        "code": "SADMM",
        "region": "Middle East",
        "lat": 26.4207,
        "lng": 50.0888
    },
    {
        "id": "durban",
        "name": "Durban",
        "country": "South Africa",
        "code": "ZADUR",
        "region": "Southern Africa",
        "lat": -29.8587,
        "lng": 31.0218
    },
    {
        "id": "felixstowe",
        "name": "Felixstowe",
        "country": "United Kingdom",
        "code": "GBFXT",
        "region": "North Europe",
        "lat": 51.9639,
        "lng": 1.3511
    },
    {
        "id": "genoa",
        "name": "Genoa",
        "country": "Italy",
        "code": "ITGOA",
        "region": "Mediterranean",
        "lat": 44.4056,
        "lng": 8.9463
    },
    {
        "id": "ho-chi-minh-city",
        "name": "Ho Chi Minh City",
        "country": "Vietnam",
        "code": "VNSGN",
        "region": "Southeast Asia",
        "lat": 10.8231,
        "lng": 106.6297
    },
    {
        "id": "hong-kong",
        "name": "Hong Kong",
        "country": "Hong Kong",
        "code": "HKHKG",
        "region": "East Asia",
        "lat": 22.3193,
        "lng": 114.1694
    },
    {
        "id": "jakarta",
        "name": "Jakarta",
        "country": "Indonesia",
        "code": "IDJKT",
        "region": "Southeast Asia",
        "lat": -6.2088,
        "lng": 106.8456
    },
    {
        "id": "kaohsiung",
        "name": "Kaohsiung",
        "country": "Taiwan",
        "code": "TWKHH",
        "region": "East Asia",
        "lat": 22.6273,
        "lng": 120.3014
    },
    {
        "id": "kolkata",
        "name": "Kolkata",
        "country": "India",
        "code": "INCCU",
        "region": "South Asia",
        "lat": 22.5726,
        "lng": 88.3639
    },
    {
        "id": "laem-chabang",
        "name": "Laem Chabang",
        "country": "Thailand",
        "code": "THLCH",
        "region": "Southeast Asia",
        "lat": 13.0827,
        "lng": 100.9135
    },
    {
        "id": "lagos",
        "name": "Lagos",
        "country": "Nigeria",
        "code": "NGLOS",
        "region": "West Africa",
        "lat": 6.5244,
        "lng": 3.3792
    },
    {
        "id": "long-beach",
        "name": "Long Beach",
        "country": "United States",
        "code": "USLGB",
        "region": "North America West Coast",
        "lat": 33.7701,
        "lng": -118.1937
    },
    {
        "id": "manila",
        "name": "Manila",
        "country": "Philippines",
        "code": "PHMNL",
        "region": "Southeast Asia",
        "lat": 14.5995,
        "lng": 120.9842
    },
    {
        "id": "manzanillo",
        "name": "Manzanillo",
        "country": "Mexico",
        "code": "MXZLO",
        "region": "Central America",
        "lat": 19.0522,
        "lng": -104.3158
    },
    {
        "id": "melbourne",
        "name": "Melbourne",
        "country": "Australia",
        "code": "AUMEL",
        "region": "Oceania",
        "lat": -37.8136,
        "lng": 144.9631
    },
    {
        "id": "mombasa",
        "name": "Mombasa",
        "country": "Kenya",
        "code": "KEMBA",
        "region": "East Africa",
        "lat": -4.0435,
        "lng": 39.6682
    },
    {
        "id": "new-york",
        "name": "New York",
        "country": "United States",
        "code": "USNYC",
        "region": "North America East Coast",
        "lat": 40.7128,
        "lng": -74.0060
    },
    {
        "id": "ningbo",
        "name": "Ningbo",
        "country": "China",
        "code": "CNNGB",
        "region": "East Asia",
        "lat": 29.8683,
        "lng": 121.5440
    },
    {
        "id": "piraeus",
        "name": "Piraeus",
        "country": "Greece",
        "code": "GRPIR",
        "region": "Mediterranean",
        "lat": 37.9429,
        "lng": 23.6469
    },
    {
        "id": "port-klang",
        "name": "Port Klang",
        "country": "Malaysia",
        "code": "MYPKG",
        "region": "Southeast Asia",
        "lat": 2.9999,
        "lng": 101.3928
    },
    {
        "id": "qingdao",
        "name": "Qingdao",
        "country": "China",
        "code": "CNTAO",
        "region": "East Asia",
        "lat": 36.0671,
        "lng": 120.3826
    },
    {
        "id": "santos",
        "name": "Santos",
        "country": "Brazil",
        "code": "BRSSZ",
        "region": "South America East Coast",
        "lat": -23.9608,
        "lng": -46.3336
    },
    {
        "id": "savannah",
        "name": "Savannah",
        "country": "United States",
        "code": "USSAV",
        "region": "North America East Coast",
        "lat": 32.0809,
        "lng": -81.0912
    },
    {
        "id": "suez",
        "name": "Suez",
        "country": "Egypt",
        "code": "EGSUZ",
        "region": "Middle East / Red Sea",
        "lat": 29.9668,
        "lng": 32.5498
    },
    {
        "id": "sydney",
        "name": "Sydney",
        "country": "Australia",
        "code": "AUSYD",
        "region": "Oceania",
        "lat": -33.8688,
        "lng": 151.2093
    },
    {
        "id": "tanjung-pelepas",
        "name": "Tanjung Pelepas",
        "country": "Malaysia",
        "code": "MYTPP",
        "region": "Southeast Asia",
        "lat": 1.3653,
        "lng": 103.5511
    },
    {
        "id": "tokyo",
        "name": "Tokyo",
        "country": "Japan",
        "code": "JPTYO",
        "region": "East Asia",
        "lat": 35.6762,
        "lng": 139.6503
    },
    {
        "id": "vancouver",
        "name": "Vancouver",
        "country": "Canada",
        "code": "CAVAN",
        "region": "North America West Coast",
        "lat": 49.2827,
        "lng": -123.1207
    },
    {
        "id": "visakhapatnam",
        "name": "Visakhapatnam",
        "country": "India",
        "code": "INVTZ",
        "region": "South Asia",
        "lat": 17.6868,
        "lng": 83.2185
    },
    {
        "id": "yantian",
        "name": "Yantian",
        "country": "China",
        "code": "CNYTN",
        "region": "East Asia",
        "lat": 22.5750,
        "lng": 114.2764
    }
]

def get_all_ports():
    return PORTS_DATA

def get_port_by_name(name: str):
    name_clean = name.strip().lower()
    for port in PORTS_DATA:
        if port["name"].lower() == name_clean:
            return port
    return None
