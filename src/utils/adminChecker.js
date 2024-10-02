export const isAdmin = (chat, user) => {
  const participant = chat.participants.find(p => p.id._serialized === user.id._serialized);
  return participant ? participant.isAdmin || participant.isSuperAdmin : false;
};