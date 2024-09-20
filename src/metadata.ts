import { getInput } from '@actions/core';
import MetadataController from 'issue-metadata';

import { CustomContext } from './context';

import {
  Data,
  IssueMetadataObject,
  commentIdKey,
  issueMetadataObjectSchema,
} from './schema/metadata';

export class Metadata {
  static readonly metadataKey = 'testing-farm';

  commentID: IssueMetadataObject[typeof commentIdKey];
  data: Data[] = [];
  lock: IssueMetadataObject['lock'] = 'false';

  constructor(
    readonly issueNumber: number,
    readonly controller: MetadataController,
    readonly context: CustomContext,
    metadata: IssueMetadataObject | undefined
  ) {
    if (!metadata) {
      this.commentID = undefined;
      return;
    }

    this.commentID = metadata[commentIdKey];
    this.data = metadata.data;
    this.lock = metadata.lock;
  }

  async setMetadata(data: Data[], lock: IssueMetadataObject['lock'] = 'false') {
    if (this.commentID === undefined) return;
    this.data = data;
    this.lock = lock;

    await this.controller.setMetadata(this.issueNumber, {
      [commentIdKey]: this.commentID,
      lock,
      data: this.data,
    });
  }

  async refresh() {
    const parsedMetadata = issueMetadataObjectSchema.safeParse(
      await this.controller.getMetadata(this.issueNumber)
    );

    const metadata = parsedMetadata.success
      ? parsedMetadata.data
      : { data: [], [commentIdKey]: undefined, lock: 'false' as const };

    this.commentID = metadata[commentIdKey];
    this.data = metadata.data;
    this.lock = metadata.lock;
  }

  static async getMetadata(issueNumber: number, context: CustomContext) {
    const controller = new MetadataController(Metadata.metadataKey, {
      ...context.repo,
      headers: {
        authorization: `Bearer ${getInput('github_token', { required: true })}`,
      },
    });

    const metadataParsed = issueMetadataObjectSchema.safeParse(
      await controller.getMetadata(issueNumber)
    );

    return new this(
      issueNumber,
      controller,
      context,
      metadataParsed.success ? metadataParsed.data : undefined
    );
  }
}
