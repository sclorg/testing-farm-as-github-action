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

import json
import sys
from typing import Dict

# First parameter has to be defined.
# File generates variables or secreted for TMT
# Format is in JSON file:
# { 'key1': 'value1', 'key2': 'value2' }

json_dict: Dict = {}
output_name = ""
if len(sys.argv) == 2:
    output_name = sys.argv[1]
    if output_name != "variables" and output_name != "secrets":
        sys.exit(1)

if len(sys.argv) > 2:
    output_name = sys.argv[1]
    input_variables = sys.argv[2]
    if not input_variables.strip():
        json_dict = {}
    else:
        json_dict = {key: value for key, value in [s.split("=", 1) for s in input_variables.split(";")]}

json_string = json.dumps(json_dict)
with open(output_name, "w") as file:
    file.write(json_string)
