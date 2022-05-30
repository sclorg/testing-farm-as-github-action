#!/usr/bin/python
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

# This file tests generate_tmt_vars.py and generate_artifacts.py

import os
import subprocess
import json


TESTDIR = os.path.dirname(os.path.realpath(__file__))


def test_tmt_variables_empty():
    ret_code = subprocess.call(f"python3 {TESTDIR}/../generate_tmt_vars.py", shell=True)
    assert ret_code == 1


def test_tmt_variables_wrong_first_parameter():
    ret_code = subprocess.call(f"python3 {TESTDIR}/../generate_tmt_vars.py \"data=123\"", shell=True)
    assert ret_code == 1


def test_tmt_variables_missing_second_parameter():
    expected = {}
    output_name = "variables"
    ret_val = subprocess.call(f"python3 {TESTDIR}/../generate_tmt_vars.py \"{output_name}\"", shell=True)
    assert ret_val == 0
    with open(output_name, "r") as f:
        data = f.read()
    json_string = json.loads(data)
    assert json_string == expected


def test_tmt_context_missing_second_parameter():
    expected = {}
    output_name = "tmt_context"
    ret_val = subprocess.call(f"python3 {TESTDIR}/../generate_tmt_vars.py \"{output_name}\"", shell=True)
    assert ret_val == 0
    with open(output_name, "r") as f:
        data = f.read()
    json_string = json.loads(data)
    assert json_string == expected


def test_tmt_variables_one_parameter():
    expected = {"data": "123"}
    output_name = "variables"
    ret_val = subprocess.call(f"python3 {TESTDIR}/../generate_tmt_vars.py \"{output_name}\" \"data=123\"", shell=True)
    assert ret_val == 0
    with open(output_name, "r") as f:
        data = f.read()
    json_string = json.loads(data)
    assert json_string == expected


def test_tmt_context_one_parameter():
    expected = {"data": "123"}
    output_name = "tmt_context"
    ret_val = subprocess.call(f"python3 {TESTDIR}/../generate_tmt_vars.py \"{output_name}\" \"data=123\"", shell=True)
    assert ret_val == 0
    with open(output_name, "r") as f:
        data = f.read()
    json_string = json.loads(data)
    assert json_string == expected


def test_tmt_variables_two_variable():
    expected = {"data": "123", "second": "987"}
    output_name = "variables"
    ret_code = subprocess.call(f"python3 {TESTDIR}/../generate_tmt_vars.py \"{output_name}\" \"data=123;second=987\"", shell=True)
    assert ret_code == 0
    with open(output_name, "r") as f:
        data = f.read()
    json_string = json.loads(data)
    assert json_string == expected


def test_tmt_artifacts_one_variable():
    expected = {"data": "123"}
    output_name = "artifacts"
    ret_code = subprocess.call(f"python3 {TESTDIR}/../generate_tmt_vars.py \"{output_name}\" \"data=123\"", shell=True)
    assert ret_code == 0
    with open(output_name, "r") as f:
        data = f.read()
    json_string = json.loads(data)
    assert json_string == expected


def test_tmt_secrets_missing_second_parameter():
    expected = "{}"
    output_name = "secrets"
    ret_code = subprocess.call(f"python3 {TESTDIR}/../generate_tmt_vars.py \"{output_name}\"", shell=True)
    assert ret_code == 0
    with open(output_name, "r") as f:
        data = f.read()
    assert data == expected


def test_tmt_secrets_one_variable():
    expected = {"TOPSECRET": "MY_TOKEN"}
    output_name = "secrets"
    ret_code = subprocess.call(f"python3 {TESTDIR}/../generate_tmt_vars.py \"{output_name}\" \"TOPSECRET=MY_TOKEN\"",
                               shell=True)
    assert ret_code == 0
    with open(output_name, "r") as f:
        data = f.read()
    json_string = json.loads(data)
    assert json_string == expected


def test_tmt_secrets_two_variable():
    expected = {"TOPSECRET": "MY_TOKEN", "GITHUB_TOKEN": "FOOBAR_TOKEN"}
    output_name = "secrets"
    ret_code = subprocess.call(
        f"python3 {TESTDIR}/../generate_tmt_vars.py \"{output_name}\" \"TOPSECRET=MY_TOKEN;GITHUB_TOKEN=FOOBAR_TOKEN\"",
        shell=True
    )
    assert ret_code == 0
    with open(output_name, "r") as f:
        data = f.read()
    json_string = json.loads(data)
    assert json_string == expected


def test_artifacts_empty():
    expected = ""
    output_name = "copr_artifacts"
    ret_code = subprocess.call(f"python3 {TESTDIR}/../generate_artifacts.py", shell=True)
    assert ret_code == 0
    with open(output_name, "r") as f:
        data = f.read()
    assert data == expected


def test_artifacts_empty_copr():
    expected = ""
    output_name = "copr_artifacts"
    ret_code = subprocess.call(f"python3 {TESTDIR}/../generate_artifacts.py \"12345;98876\"", shell=True)
    assert ret_code == 0
    with open(output_name, "r") as f:
        data = f.read()
    assert data == expected


def test_artifacts():
    expected = {"artifacts": [
        {"type": "fedora-copr-build", "id": "12345:epel-8-x86_64"},
        {"type": "fedora-copr-build", "id": "98876:epel-8-x86_64"}]
    }
    output_name = "copr_artifacts"
    ret_code = subprocess.call(
        f"python3 {TESTDIR}/../generate_artifacts.py \"12345;98876\" \"epel-8-x86_64\"",
        shell=True
    )
    assert ret_code == 0
    with open(output_name, "r") as f:
        data = f.read()
    json_string = json.loads(data)
    assert json_string == expected
