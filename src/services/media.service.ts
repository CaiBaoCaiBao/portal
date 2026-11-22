import "server-only";

import {
    MediaAssetDao,
    MediaFolderDao
} from "@/dao";
import {
    MediaFolderDTO,
    MediaFolderQueryDTO,
    mediaFolderOrderSchema,
} from "@/schema/media";
import {
    PaginationDTO,
    OrderDTO,
    IdQueryDTO
} from "@/schema/globals.schema";
import {
    BadRequestError,
    ConflictError,
    NotFoundError
} from "@/lib";
import { MediaFolderListVO } from "@/types/media.type";

export class MediaService {

    // ========================================================================
    // ========================== FOLDER SERVICES =============================
    // ========================================================================

    /** @description 创建媒体目录 */
    static async createFolder(dto: MediaFolderDTO) {
        const uniqueName = await MediaFolderDao.findByName(dto.name);
        if (!uniqueName) {
            throw new ConflictError("MEDIA", "Folder Name is already in use");
        }
        await MediaFolderDao.insert(dto);
    }

    /** @description 更新媒体目录 */
    static async updateFolder(id: IdQueryDTO, dto: MediaFolderDTO) {
        const folder = await MediaFolderDao.findById(id);
        if (!folder) throw new NotFoundError("MEDIA", "Folder not found");
        if (folder.name === dto.name) return;
        await MediaFolderDao.update(id, dto);
    }

    /** @description 删除媒体目录 */
    static async deleteFolder(id: IdQueryDTO) {
        const folder = await MediaFolderDao.findById(id);
        if (!folder) throw new NotFoundError("MEDIA", "Folder not found");
        const assets = await MediaAssetDao.query({ folderId: id });
        if (assets.total > 0) throw new BadRequestError("MEDIA", "Folder is not empty");
        await MediaFolderDao.delete(id);
    }

    /** @description 获取媒体目录列表 */
    static async getFolderList(
        query: MediaFolderQueryDTO = {},
        page: PaginationDTO = { pageIndex: 0, pageSize: 10 },
        order: OrderDTO<typeof mediaFolderOrderSchema> = []
    ): Promise<{
        list: MediaFolderListVO[],
        total: number,
    }> {
        const { rows, total } = await MediaFolderDao.query(query, page, order);
        return {
            list: rows,
            total
        }
    }
}