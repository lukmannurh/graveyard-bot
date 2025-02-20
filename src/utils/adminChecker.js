import logger from "./logger.js";

export const isAdmin = async (chat, sender) => {
  try {
    // Pastikan properti participants ada dan merupakan array
    if (!chat || !Array.isArray(chat.participants)) {
      logger.warn("Chat participants tidak tersedia atau bukan array.");
      return false;
    }
    
    // Cari participant yang cocok dengan sender
    const participant = chat.participants.find(
      (p) => p.id && p.id._serialized === sender.id._serialized
    );
    
    if (!participant) {
      logger.warn(`Participant dengan id ${sender.id._serialized} tidak ditemukan.`);
      return false;
    }
    
    // Mengembalikan true jika participant memiliki properti isAdmin atau isSuperAdmin bernilai true
    return participant.isAdmin === true || participant.isSuperAdmin === true;
  } catch (error) {
    logger.error("Error in isAdmin:", error);
    return false;
  }
};
