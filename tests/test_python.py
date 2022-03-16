#!/usr/bin/python

import os
import subprocess
import json


TESTDIR = os.path.dirname(os.path.realpath(__file__))


def test_tmt_variables_empty():
    expected = "{}"
    subprocess.call(f"python3 {TESTDIR}/../generate_tmt_variables.py", shell=True)
    assert open("variables")
    with open("variables", "r") as f:
        data = f.read()
    assert data == expected


def test_tmt_variables_one_variable():
    expected = {"data": "123"}
    subprocess.call(f"python3 {TESTDIR}/../generate_tmt_variables.py \"data=123\"", shell=True)
    assert open("variables")
    with open("variables", "r") as f:
        data = f.read()
    json_string = json.loads(data)
    print(json_string)
    assert json_string == expected


def test_tmt_variables_two_variable():
    expected = {"data": "123", "second": "987"}
    subprocess.call(f"python3 {TESTDIR}/../generate_tmt_variables.py \"data=123;second=987\"", shell=True)
    assert open("variables")
    with open("variables", "r") as f:
        data = f.read()
    json_string = json.loads(data)
    print(json_string)
    assert json_string == expected


def test_tmt_secrets_empty():
    expected = "{}"
    subprocess.call(f"python3 {TESTDIR}/../generate_tmt_secrets.py", shell=True)
    assert open("secrets")
    with open("secrets", "r") as f:
        data = f.read()
    assert data == expected


def test_tmt_secrets_one_variable():
    expected = {"TOPSECRET": "MY_TOKEN"}
    subprocess.call(f"python3 {TESTDIR}/../generate_tmt_secrets.py \"TOPSECRET=MY_TOKEN\"", shell=True)
    assert open("secrets")
    with open("secrets", "r") as f:
        data = f.read()
    json_string = json.loads(data)
    print(json_string)
    assert json_string == expected


def test_tmt_secrets_two_variable():
    expected = {"TOPSECRET": "MY_TOKEN", "GITHUB_TOKEN": "FOOBAR_TOKEN"}
    subprocess.call(
        f"python3 {TESTDIR}/../generate_tmt_secrets.py \"TOPSECRET=MY_TOKEN;GITHUB_TOKEN=FOOBAR_TOKEN\"",
        shell=True
    )
    assert open("secrets")
    with open("secrets", "r") as f:
        data = f.read()
    json_string = json.loads(data)
    print(json_string)
    assert json_string == expected


def test_artifacts_empty():
    expected = ""
    subprocess.call(f"python3 {TESTDIR}/../generate_artifacts.py", shell=True)
    assert open("copr_artifacts")
    with open("copr_artifacts", "r") as f:
        data = f.read()
    assert data == expected


def test_artifacts_empty_copr():
    expected = ""
    subprocess.call(f"python3 {TESTDIR}/../generate_artifacts.py \"12345;98876\"", shell=True)
    assert open("copr_artifacts")
    with open("copr_artifacts", "r") as f:
        data = f.read()
    assert data == expected


def test_artifacts():
    expected = {"artifacts": [
        {"type": "fedora-copr-build", "id": "12345:epel-8-x86_64"},
        {"type": "fedora-copr-build", "id": "98876:epel-8-x86_64"}]
    }
    subprocess.call(
        f"python3 {TESTDIR}/../generate_artifacts.py \"12345;98876\" \"epel-8-x86_64\"",
        shell=True
    )
    assert open("copr_artifacts")
    with open("copr_artifacts", "r") as f:
        data = f.read()
    json_string = json.loads(data)
    print(json_string)
    assert json_string == expected
