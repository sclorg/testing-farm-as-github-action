/** This file contains unit tests for Summary class.
 * vitest general documentation - https://vitest.dev/
 * vi API documentation (mocking) - https://vitest.dev/api/vi.html#vi
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { Summary } from '../../src/summary';
import { Data } from '../../src/schema/metadata';

let currentData: Data[] = [];

describe('Summary class', () => {
  beforeEach(() => {
    vi.stubEnv('TZ', 'UTC');

    currentData = [
      {
        id: '1',
        name: 'test1',
        status: 'pending',
        runTime: 35,
        created: '2019-08-24T14:15:22Z',
        updated: '2019-08-24T14:15:22Z',
        compose: 'Fedora-latest',
        arch: 'x86_64',
        infrastructureFailure: false,
        results: ['test', 'pipeline'],
      },
      {
        id: '2',
        name: 'test2',
        status: 'success',
        runTime: 600,
        created: '2019-08-24T14:15:22Z',
        updated: '2019-08-24T14:15:22Z',
        compose: 'CentOS-Stream-9',
        arch: 'x86_64',
        infrastructureFailure: false,
        results: ['test', 'pipeline'],
      },
      {
        id: '3',
        name: 'test3',
        status: 'failure',
        runTime: 3600,
        created: '2019-08-24T14:15:22Z',
        updated: '2019-08-24T14:15:22Z',
        compose: 'Fedora-latest',
        arch: 'x86_64',
        infrastructureFailure: false,
        results: ['test', 'pipeline'],
      },
      {
        id: '4',
        name: 'test4',
        status: 'failure',
        runTime: 5701,
        created: '2019-08-24T14:15:22Z',
        updated: '2019-08-24T14:15:22Z',
        compose: 'Fedora-latest',
        arch: 'x86_64',
        infrastructureFailure: true,
        results: ['test', 'pipeline'],
      },
    ];
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('can be instantiated', () => {
    const summary = new Summary([], {
      id: '1',
      name: 'test1',
      status: 'success',
      runTime: 5701,
      created: '2019-08-24T14:15:22Z',
      updated: '2019-08-24T14:15:22Z',
      compose: 'Fedora-latest',
      arch: 'x86_64',
      infrastructureFailure: false,
      results: ['test', 'pipeline'],
    });

    expect(summary).toBeDefined();
    expect(summary).toBeInstanceOf(Summary);
    expect(summary.data).toHaveLength(1);

    expect(summary.newData).toMatchInlineSnapshot(`
      {
        "arch": "x86_64",
        "compose": "Fedora-latest",
        "created": "2019-08-24T14:15:22Z",
        "id": "1",
        "infrastructureFailure": false,
        "name": "test1",
        "results": [
          "test",
          "pipeline",
        ],
        "runTime": 5701,
        "status": "success",
        "updated": "2019-08-24T14:15:22Z",
      }
    `);
    expect(summary.data).toEqual([summary.newData]);
  });

  test('add data entry to existing summary data', () => {
    const summary = new Summary(currentData, {
      id: '5',
      name: 'test5',
      status: 'pending',
      runTime: 5701,
      created: '2019-08-24T14:15:22Z',
      updated: '2019-08-24T14:15:22Z',
      compose: 'Fedora-latest',
      arch: 'x86_64',
      infrastructureFailure: false,
      results: ['test', 'pipeline'],
    });

    expect(summary.data).toHaveLength(5);
    expect(summary.data).toMatchInlineSnapshot(`
      [
        {
          "arch": "x86_64",
          "compose": "Fedora-latest",
          "created": "2019-08-24T14:15:22Z",
          "id": "1",
          "infrastructureFailure": false,
          "name": "test1",
          "results": [
            "test",
            "pipeline",
          ],
          "runTime": 35,
          "status": "pending",
          "updated": "2019-08-24T14:15:22Z",
        },
        {
          "arch": "x86_64",
          "compose": "CentOS-Stream-9",
          "created": "2019-08-24T14:15:22Z",
          "id": "2",
          "infrastructureFailure": false,
          "name": "test2",
          "results": [
            "test",
            "pipeline",
          ],
          "runTime": 600,
          "status": "success",
          "updated": "2019-08-24T14:15:22Z",
        },
        {
          "arch": "x86_64",
          "compose": "Fedora-latest",
          "created": "2019-08-24T14:15:22Z",
          "id": "3",
          "infrastructureFailure": false,
          "name": "test3",
          "results": [
            "test",
            "pipeline",
          ],
          "runTime": 3600,
          "status": "failure",
          "updated": "2019-08-24T14:15:22Z",
        },
        {
          "arch": "x86_64",
          "compose": "Fedora-latest",
          "created": "2019-08-24T14:15:22Z",
          "id": "4",
          "infrastructureFailure": true,
          "name": "test4",
          "results": [
            "test",
            "pipeline",
          ],
          "runTime": 5701,
          "status": "failure",
          "updated": "2019-08-24T14:15:22Z",
        },
        {
          "arch": "x86_64",
          "compose": "Fedora-latest",
          "created": "2019-08-24T14:15:22Z",
          "id": "5",
          "infrastructureFailure": false,
          "name": "test5",
          "results": [
            "test",
            "pipeline",
          ],
          "runTime": 5701,
          "status": "pending",
          "updated": "2019-08-24T14:15:22Z",
        },
      ]
    `);
  });

  test('update existing data entry in summary data', () => {
    const summary = new Summary(currentData, {
      id: '1',
      name: 'test1',
      status: 'success',
      runTime: 5701,
      created: '2019-08-24T14:15:22Z',
      updated: '2019-08-24T14:15:22Z',
      compose: 'Fedora-latest',
      arch: 'x86_64',
      infrastructureFailure: false,
      results: ['test', 'pipeline'],
    });

    expect(summary.data).toHaveLength(4);
    expect(summary.data).toMatchInlineSnapshot(`
      [
        {
          "arch": "x86_64",
          "compose": "Fedora-latest",
          "created": "2019-08-24T14:15:22Z",
          "id": "1",
          "infrastructureFailure": false,
          "name": "test1",
          "results": [
            "test",
            "pipeline",
          ],
          "runTime": 5701,
          "status": "success",
          "updated": "2019-08-24T14:15:22Z",
        },
        {
          "arch": "x86_64",
          "compose": "CentOS-Stream-9",
          "created": "2019-08-24T14:15:22Z",
          "id": "2",
          "infrastructureFailure": false,
          "name": "test2",
          "results": [
            "test",
            "pipeline",
          ],
          "runTime": 600,
          "status": "success",
          "updated": "2019-08-24T14:15:22Z",
        },
        {
          "arch": "x86_64",
          "compose": "Fedora-latest",
          "created": "2019-08-24T14:15:22Z",
          "id": "3",
          "infrastructureFailure": false,
          "name": "test3",
          "results": [
            "test",
            "pipeline",
          ],
          "runTime": 3600,
          "status": "failure",
          "updated": "2019-08-24T14:15:22Z",
        },
        {
          "arch": "x86_64",
          "compose": "Fedora-latest",
          "created": "2019-08-24T14:15:22Z",
          "id": "4",
          "infrastructureFailure": true,
          "name": "test4",
          "results": [
            "test",
            "pipeline",
          ],
          "runTime": 5701,
          "status": "failure",
          "updated": "2019-08-24T14:15:22Z",
        },
      ]
    `);
  });

  test('get table header', () => {
    const summary = new Summary([], currentData[0]);

    expect(summary.getTableHeader()).toMatchInlineSnapshot(`
      [
        {
          "data": "name",
          "header": true,
        },
        {
          "data": "compose",
          "header": true,
        },
        {
          "data": "arch",
          "header": true,
        },
        {
          "data": "status",
          "header": true,
        },
        {
          "data": "started (UTC)",
          "header": true,
        },
        {
          "data": "time",
          "header": true,
        },
        {
          "data": "logs",
          "header": true,
        },
      ]
    `);
  });

  test('get table row', () => {
    const summary = new Summary(currentData, currentData[0]);

    expect(summary.getTableRow(currentData[0])).toMatchInlineSnapshot(`
      [
        "test1",
        "Fedora-latest",
        "x86_64",
        "⏳ pending",
        "24.08.2019 14:15:22",
        "35s",
        "test pipeline",
      ]
    `);
  });

  test('get table summary', () => {
    const summary = new Summary(currentData, currentData[0]);

    expect(summary.getTableSummary()).toMatchInlineSnapshot(`
      "<table><tr><th>name</th><th>compose</th><th>arch</th><th>status</th><th>started (UTC)</th><th>time</th><th>logs</th></tr><tr><td>test1</td><td>Fedora-latest</td><td>x86_64</td><td>⏳ pending</td><td>24.08.2019 14:15:22</td><td>35s</td><td>test pipeline</td></tr><tr><td>test2</td><td>CentOS-Stream-9</td><td>x86_64</td><td>✅ success</td><td>24.08.2019 14:15:22</td><td>10min </td><td>test pipeline</td></tr><tr><td>test3</td><td>Fedora-latest</td><td>x86_64</td><td>❌ failure</td><td>24.08.2019 14:15:22</td><td>1h </td><td>test pipeline</td></tr><tr><td>test4</td><td>Fedora-latest</td><td>x86_64</td><td>⛔ infra error</td><td>24.08.2019 14:15:22</td><td>1h 35min 1s</td><td>test pipeline</td></tr></table>
      "
    `);
  });

  test('isResultPresent()', () => {
    expect(Summary.isResultPresent(currentData, 'test1'))
      .toMatchInlineSnapshot(`
      {
        "index": 0,
        "presence": true,
      }
    `);

    expect(Summary.isResultPresent(currentData, 'test5'))
      .toMatchInlineSnapshot(`
      {
        "index": undefined,
        "presence": false,
      }
    `);

    expect(Summary.isResultPresent(currentData, 'test6'))
      .toMatchInlineSnapshot(`
      {
        "index": undefined,
        "presence": false,
      }
    `);
  });
});
