import { getCollectionName } from '@/reports/helpers/subject'
import { isFullRecordAtUri } from '@/lib/util'
import {
  AtUri,
  ComAtprotoAdminDefs,
  ComAtprotoRepoStrongRef,
  ToolsOzoneModerationDefs,
} from '@atproto/api'

/**
 * Returns the display category for a moderation event subject.
 *
 * Malformed record-shaped subjects intentionally fall back to the generic
 * label so historical event rendering never depends on reparsing bad data.
 */
export const getSubjectTitle = (
  subject: ToolsOzoneModerationDefs.ModEventView['subject'],
) => {
  if (ComAtprotoAdminDefs.isRepoRef(subject)) {
    return 'Account'
  }

  if (
    ComAtprotoRepoStrongRef.isMain(subject) &&
    isFullRecordAtUri(subject.uri)
  ) {
    const atUri = new AtUri(subject.uri)
    const collection = atUri.collection
    return getCollectionName(collection)
  }

  return 'Subject'
}
