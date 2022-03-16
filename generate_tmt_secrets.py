import json
import sys
from typing import Dict

json_dict: Dict = {}
if len(sys.argv) > 1:
    input_secrets = sys.argv[1]
    if not input_secrets.strip():
        json_dict = {}
    else:
        json_dict = {key: value for key, value in [s.split("=", 1) for s in input_secrets.split(";")]}

json_string = json.dumps(json_dict)
with open("secrets", "w") as file:
    file.write(json_string)
