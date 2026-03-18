import bcrypt from 'bcrypt';

export async function hashPassword(password) {
  const salt = bcrypt.genSaltSync(12);
  return await bcrypt.hash(password, salt);
}

export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}
