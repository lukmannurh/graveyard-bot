export const isAdmin = (chat, user) => {
    return chat.participants.find(p => p.id._serialized === user.id._serialized)?.isAdmin;
  };