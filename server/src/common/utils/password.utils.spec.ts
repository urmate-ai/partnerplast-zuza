import * as bcrypt from 'bcrypt';
import { PasswordUtils } from './password.utils';

jest.mock('bcrypt');

describe('PasswordUtils', () => {
  const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('hash', () => {
    it('powinien zahashować hasło używając bcrypt', async () => {
      const plainPassword = 'password123';
      const hashedPassword = 'hashed-password-123';

      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const result = await PasswordUtils.hash(plainPassword);

      expect(mockBcrypt.hash).toHaveBeenCalledWith(plainPassword, 10);
      expect(result).toBe(hashedPassword);
    });
  });

  describe('compare', () => {
    it('powinien porównać hasło z hashem i zwrócić true gdy się zgadzają', async () => {
      const plainPassword = 'password123';
      const hashedPassword = 'hashed-password-123';

      mockBcrypt.compare.mockResolvedValue(true as never);

      const result = await PasswordUtils.compare(plainPassword, hashedPassword);

      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        plainPassword,
        hashedPassword,
      );
      expect(result).toBe(true);
    });

    it('powinien zwrócić false gdy hasła się nie zgadzają', async () => {
      const plainPassword = 'wrong-password';
      const hashedPassword = 'hashed-password-123';

      mockBcrypt.compare.mockResolvedValue(false as never);

      const result = await PasswordUtils.compare(plainPassword, hashedPassword);

      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        plainPassword,
        hashedPassword,
      );
      expect(result).toBe(false);
    });
  });
});
