import { getInput } from '@actions/core';
import { context } from '@actions/github';
import MetadataController from 'issue-metadata';
import { z } from 'zod';

let summary_info: { "pull_request_status_name": string, "compose": string, "results": string, "logs": string }


type MetadataObject = {
  TFCommentID: string | undefined;
  TFDatetime: string | undefined
  TFSummaryInfo: unknown[];
};



export class Metadata {
  private _TFcommentID: MetadataObject['TFCommentID'];

  constructor(
    readonly issueNumber: number,
    readonly controller: MetadataController,
    metadata: MetadataObject
  ) {
    this._TFcommentID = metadata?.TFCommentID ?? undefined;
    this._TFDatetime = metadata?.TFDatetime ?? undefined;
    this._TFSummaryInfo = metadata?._TFSummaryInfo ?? [];
  }

  get commentID() {
    return this._TFcommentID;
  }

  get summaryInfo() {
      return this._TFSummaryInfo;
  }

  get dateTimeInfo() {
      return this._TFDatetime;
  }

  set commentID(value: MetadataObject['TFCommentID']) {
    if (this._TFcommentID === undefined) {
      this._TFcommentID = value;
    }
  }

  set dateTimeInfo(value: MetadataObject['TFDatetime']) {
      this._TFDatetime = value;
  }

  set updateSummaryInfo(value: MetadataObject['TFSummaryInfo']) {
      this._TFSummaryInfo = value;
  }

  static readonly metadataCommentID = 'tf-comment-id';

  async setMetadata(): Promise<void> {
    if (this.TestingFarmCommentID !== undefined) {
      await this.controller.setMetadata(
        this.issueNumber,
        Metadata.metadataCommentID,
        this.commentID ?? ''
      );
    }

    // TODO: clear tag when un-freezed
    await this.controller.setMetadata(
      this.issueNumber,
    );
  }

  static async getMetadata(issueNumber: number): Promise<Metadata> {
    const controller = new MetadataController('tf-comment-id', {
      ...context.repo,
      headers: {
        authorization: `Bearer ${getInput('token', { required: true })}`,
      },
    });

    const parsedCommentID = z
      .string()
      .safeParse(
        await controller.getMetadata(issueNumber, Metadata.metadataCommentID)
      );

    return new Metadata(issueNumber, controller, {
      commentID: parsedCommentID.success ? parsedCommentID.data : undefined,
    });
  }

}