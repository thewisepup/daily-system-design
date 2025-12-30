import { companyService } from "~/server/services/CompanyService";
import { companyRepo } from "~/server/db/repo/CompanyRepo";
import { CompanyFactory } from "~/test/factories";

vi.mock("~/server/db/repo/CompanyRepo", () => ({
  companyRepo: {
    createCompany: vi.fn(),
    patchCompany: vi.fn(),
  },
}));

const mockedCompanyRepo = vi.mocked(companyRepo);
const { createCompany: mockCreateCompany, patchCompany: mockPatchCompany } =
  mockedCompanyRepo;

describe("CompanyService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createCompany", () => {
    it("successfully creates company with valid name", async () => {
      const companyName = "Test Company";
      const mockCompany = CompanyFactory.createCompany({ name: companyName });
      mockCreateCompany.mockResolvedValue([mockCompany]);

      await companyService.createCompany({ name: companyName });

      expect(mockCreateCompany).toHaveBeenCalledWith(companyName);
      expect(mockCreateCompany).toHaveBeenCalledTimes(1);
    });

    it("calls repo.createCompany with correct name parameter", async () => {
      const companyName = "Acme Corp";
      mockCreateCompany.mockResolvedValue([
        CompanyFactory.createCompany({ name: companyName }),
      ]);

      await companyService.createCompany({ name: companyName });

      expect(mockCreateCompany).toHaveBeenCalledWith(companyName);
    });
  });

  describe("patchCompany", () => {
    it("successfully patches company with id and name", async () => {
      const companyId = 1;
      const newName = "Updated Company Name";
      const mockCompany = CompanyFactory.createCompany({
        id: companyId,
        name: newName,
      });
      mockPatchCompany.mockResolvedValue([mockCompany]);

      await companyService.patchCompany({ id: companyId, name: newName });

      expect(mockPatchCompany).toHaveBeenCalledWith(companyId, { name: newName });
      expect(mockPatchCompany).toHaveBeenCalledTimes(1);
    });

    it("successfully patches company with only id (no name change)", async () => {
      const companyId = 2;
      const mockCompany = CompanyFactory.createCompany({ id: companyId });
      mockPatchCompany.mockResolvedValue([mockCompany]);

      await companyService.patchCompany({ id: companyId });

      expect(mockPatchCompany).toHaveBeenCalledWith(companyId, {});
      expect(mockPatchCompany).toHaveBeenCalledTimes(1);
    });

    it("calls repo.patchCompany with correct id and data object (destructured)", async () => {
      const companyId = 3;
      const newName = "Another Updated Name";
      mockPatchCompany.mockResolvedValue([
        CompanyFactory.createCompany({ id: companyId, name: newName }),
      ]);

      await companyService.patchCompany({ id: companyId, name: newName });

      expect(mockPatchCompany).toHaveBeenCalledWith(companyId, { name: newName });
    });
  });

  describe("Edge Cases", () => {
    describe("createCompany", () => {
      it("handles empty string for name", async () => {
        const companyName = "";
        const mockCompany = CompanyFactory.createCompany({ name: companyName });
        mockCreateCompany.mockResolvedValue([mockCompany]);

        await companyService.createCompany({ name: companyName });

        expect(mockCreateCompany).toHaveBeenCalledWith(companyName);
      });

      it("handles very long company names (>1000 chars)", async () => {
        const companyName = "A".repeat(1001);
        const mockCompany = CompanyFactory.createCompany({ name: companyName });
        mockCreateCompany.mockResolvedValue([mockCompany]);

        await companyService.createCompany({ name: companyName });

        expect(mockCreateCompany).toHaveBeenCalledWith(companyName);
      });

      it("handles special characters in name (Unicode)", async () => {
        const companyName = "Café & Co. カフェ 公司";
        const mockCompany = CompanyFactory.createCompany({ name: companyName });
        mockCreateCompany.mockResolvedValue([mockCompany]);

        await companyService.createCompany({ name: companyName });

        expect(mockCreateCompany).toHaveBeenCalledWith(companyName);
      });

      it("handles emojis in name", async () => {
        const companyName = "Tech 🚀 Company 💼";
        const mockCompany = CompanyFactory.createCompany({ name: companyName });
        mockCreateCompany.mockResolvedValue([mockCompany]);

        await companyService.createCompany({ name: companyName });

        expect(mockCreateCompany).toHaveBeenCalledWith(companyName);
      });

      it("handles SQL injection attempt in name", async () => {
        const companyName = "'; DROP TABLE companies; --";
        const mockCompany = CompanyFactory.createCompany({ name: companyName });
        mockCreateCompany.mockResolvedValue([mockCompany]);

        await companyService.createCompany({ name: companyName });

        expect(mockCreateCompany).toHaveBeenCalledWith(companyName);
      });
    });

    describe("patchCompany", () => {
      it("handles negative company ID", async () => {
        const companyId = -1;
        const mockCompany = CompanyFactory.createCompany({ id: companyId });
        mockPatchCompany.mockResolvedValue([mockCompany]);

        await companyService.patchCompany({ id: companyId });

        expect(mockPatchCompany).toHaveBeenCalledWith(companyId, {});
      });

      it("handles zero company ID", async () => {
        const companyId = 0;
        const mockCompany = CompanyFactory.createCompany({ id: companyId });
        mockPatchCompany.mockResolvedValue([mockCompany]);

        await companyService.patchCompany({ id: companyId });

        expect(mockPatchCompany).toHaveBeenCalledWith(companyId, {});
      });

      it("handles very large company ID", async () => {
        const companyId = Number.MAX_SAFE_INTEGER;
        const mockCompany = CompanyFactory.createCompany({ id: companyId });
        mockPatchCompany.mockResolvedValue([mockCompany]);

        await companyService.patchCompany({ id: companyId });

        expect(mockPatchCompany).toHaveBeenCalledWith(companyId, {});
      });

      it("handles empty string for name in patch", async () => {
        const companyId = 1;
        const newName = "";
        const mockCompany = CompanyFactory.createCompany({
          id: companyId,
          name: newName,
        });
        mockPatchCompany.mockResolvedValue([mockCompany]);

        await companyService.patchCompany({ id: companyId, name: newName });

        expect(mockPatchCompany).toHaveBeenCalledWith(companyId, { name: newName });
      });

      it("handles very long company name in patch (>1000 chars)", async () => {
        const companyId = 1;
        const newName = "B".repeat(1001);
        const mockCompany = CompanyFactory.createCompany({
          id: companyId,
          name: newName,
        });
        mockPatchCompany.mockResolvedValue([mockCompany]);

        await companyService.patchCompany({ id: companyId, name: newName });

        expect(mockPatchCompany).toHaveBeenCalledWith(companyId, { name: newName });
      });
    });
  });

  describe("Error Cases", () => {
    describe("createCompany", () => {
      it("handles repository error on create", async () => {
        const companyName = "Test Company";
        const error = new Error("Database connection failed");
        mockCreateCompany.mockRejectedValue(error);

        await expect(
          companyService.createCompany({ name: companyName }),
        ).rejects.toThrow("Database connection failed");

        expect(mockCreateCompany).toHaveBeenCalledWith(companyName);
      });

      it("handles repository returning empty array", async () => {
        const companyName = "Test Company";
        mockCreateCompany.mockResolvedValue([]);

        await companyService.createCompany({ name: companyName });

        expect(mockCreateCompany).toHaveBeenCalledWith(companyName);
      });

      it("handles database constraint violation (duplicate name)", async () => {
        const companyName = "Duplicate Company";
        const error = new Error("Unique constraint violation");
        mockCreateCompany.mockRejectedValue(error);

        await expect(
          companyService.createCompany({ name: companyName }),
        ).rejects.toThrow("Unique constraint violation");
      });
    });

    describe("patchCompany", () => {
      it("handles repository error on patch", async () => {
        const companyId = 1;
        const newName = "Updated Name";
        const error = new Error("Database update failed");
        mockPatchCompany.mockRejectedValue(error);

        await expect(
          companyService.patchCompany({ id: companyId, name: newName }),
        ).rejects.toThrow("Database update failed");

        expect(mockPatchCompany).toHaveBeenCalledWith(companyId, { name: newName });
      });

      it("handles repository returning empty array", async () => {
        const companyId = 1;
        mockPatchCompany.mockResolvedValue([]);

        await companyService.patchCompany({ id: companyId });

        expect(mockPatchCompany).toHaveBeenCalledWith(companyId, {});
      });

      it("handles repository returning empty array", async () => {
        const companyId = 1;
        mockPatchCompany.mockResolvedValue([]);

        await companyService.patchCompany({ id: companyId });

        expect(mockPatchCompany).toHaveBeenCalledWith(companyId, {});
      });

      it("handles database constraint violation", async () => {
        const companyId = 1;
        const newName = "Duplicate Name";
        const error = new Error("Foreign key constraint violation");
        mockPatchCompany.mockRejectedValue(error);

        await expect(
          companyService.patchCompany({ id: companyId, name: newName }),
        ).rejects.toThrow("Foreign key constraint violation");
      });
    });
  });
});
