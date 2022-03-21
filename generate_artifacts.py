# Copyright (c) 2022 Red Hat s.r.o.
#
# Permission is hereby granted, free of charge, to any person
# obtaining a copy of this software and associated documentation
# files (the "Software"), to deal in the Software without
# restriction, including without limitation the rights to use,
# copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the
# Software is furnished to do so, subject to the following
# conditions:
#
# The above copyright notice and this permission notice shall be
# included in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
# EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
# OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
# HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
# WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
# FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
# OTHER DEALINGS IN THE SOFTWARE.

# File generates artifacts for TMT
# Format is in JSON file:
# { 'artifacts' : [{'type': 'fedora-copr-build', 'id': '1234123:epel8-x86_64'}] }

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
