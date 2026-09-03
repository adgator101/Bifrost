import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string) => {
	return await bcrypt.hash(password, SALT_ROUNDS);
};

export const compareData = async (
	data: string,
	encrypted: string,
): Promise<boolean> => {
	return bcrypt.compare(data, encrypted);
};
