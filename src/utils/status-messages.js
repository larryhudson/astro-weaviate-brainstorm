const messageById = {
  'updated': 'Successfully updated',
  'created': 'Successfully created',
  'deleted': 'Successfully deleted'
}

export function getStatusMessage(statusId) {
  return messageById[statusId]
}
