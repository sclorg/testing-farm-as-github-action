import { summary } from '@actions/core';
import { format } from 'date-fns';

import { Data } from './schema/metadata';

export class Summary {
  /**
   * Summary constructor
   * @param data - Array holding all results from all the testing farm jobs
   * @param newData - The latest result from the current testing farm job
   */
  constructor(
    public data: Data[],
    public newData: Data
  ) {
    this.updateData(this.newData);
  }

  updateData(data: Data) {
    this.newData = data;

    const { presence, index } = Summary.isResultPresent(this.data, data.name);

    if (presence && index !== undefined) {
      this.data[index] = data;
    } else {
      this.data.push(data);
    }
  }

  refreshData(data: Data[]) {
    this.data = data;
    this.updateData(this.newData);
  }

  getTableHeader() {
    return [
      { data: 'name', header: true },
      { data: 'compose', header: true },
      { data: 'arch', header: true },
      { data: 'status', header: true },
      { data: 'started (UTC)', header: true },
      { data: 'time', header: true },
      { data: 'logs', header: true },
    ];
  }

  getStatusIcon(
    status: string,
    outcome: string | undefined,
    infraError: boolean
  ) {
    if (infraError) {
      return '⛔ infra error';
    }

    let switchValue = status;

    if (outcome) {
      switchValue = outcome;
    }

    switch (switchValue) {
      case 'complete':
      case 'success':
      case 'passed':
        return `✅ ${switchValue}`;
      case 'failed':
      case 'failure':
      case 'error':
        return `❌ ${switchValue}`;
      case 'new':
      case 'running':
      case 'queued':
      case 'pending':
        return `⏳ ${switchValue}`;
      default:
        return switchValue;
    }
  }

  getTime(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.round(seconds % 60);

    return `${hours ? `${hours}h ` : ''}${minutes ? `${minutes}min ` : ''}${remainingSeconds ? `${remainingSeconds}s` : ''}`;
  }

  getTableRow(data: Data) {
    return [
      data.name,
      data.compose || '&lt;container image from plan&gt;',
      data.arch,
      this.getStatusIcon(data.status, data.outcome, data.infrastructureFailure),
      format(new Date(data.created), 'dd.MM.yyyy HH:mm:ss'),
      this.getTime(data.runTime),
      data.results.join(' '),
    ];
  }

  getTableSummary(): string {
    const table = summary
      .addTable([
        this.getTableHeader(),
        ...this.data.map(rawRow => this.getTableRow(rawRow)),
      ])
      .stringify();

    summary.emptyBuffer();
    return table;
  }

  async setJobSummary() {
    await summary
      .addHeading('Testing Farm as a GitHub Action summary')
      .addTable([this.getTableHeader(), this.getTableRow(this.newData)])
      .write();
  }

  static isResultPresent(
    data: Data[],
    name: string
  ): { presence: boolean; index?: number } {
    const index = data.findIndex(result => result.name === name);

    return { presence: index !== -1, index: index !== -1 ? index : undefined };
  }
}
