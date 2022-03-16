import json
import sys
from typing import List

json_string = ""
if len(sys.argv) > 2:
    artifacts = sys.argv[1]
    copr = sys.argv[2]
    if not artifacts.strip():
        json_string = ""
    else:
        list_artifacts: List = []
        for copr_id in artifacts.split(";"):
            list_artifacts.append({"type": "fedora-copr-build", "id": f"{copr_id}:{copr}"})
        json_string = json.dumps({"artifacts": list_artifacts})

with open("copr_artifacts", "w") as file:
    file.write(json_string)
