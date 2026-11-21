import { FieldOutputTypes } from "@/prisma/contract";
import { columns } from "@/lib";
import { Row } from "./globals.type";

type MediaFolderOutput = FieldOutputTypes["public"]["MediaFolder"];
type MediaAssetOutput = FieldOutputTypes["public"]["MediaAsset"];
type MediaFileOutput = FieldOutputTypes["public"]["MediaFile"];
type MediaVariantOutput = FieldOutputTypes["public"]["MediaVariant"];

const folderColumns = columns<MediaFolderOutput>();
const assetColumns = columns<MediaAssetOutput>();
const fileColumns = columns<MediaFileOutput>();
const variantColumns = columns<MediaVariantOutput>();

export const mediaFolderListFields = folderColumns("id", "name");
export const mediaFolderDetailFields = mediaFolderListFields;
export const mediaAssetListFields = assetColumns(
    "id", "title", "folderId", "currentFileId"
);
export const mediaAssetDetailFields = assetColumns(
    "id", "title", "folderId", "currentFileId",
    "description", "kind", "status", "createdAt",
    "updatedAt"
);
export const mediaFileListFiles = fileColumns(
    "id", "originalName", "size", "status", "createdAt", "url", "version",
    "width", "height", "durationMs"
)
export const mediaFileDetailFields = fileColumns(
    "id", "originalName", "size", "status", "createdAt", "url", "version",
    "width", "height", "durationMs", "checksum", "storageKey"
)
export const mediaVariantListFields = variantColumns(
    "id", "fileId", "height", "width", "mime", "purpose", "storageKey", "size", "url"
)

export type MediaFolderListColumns = Row<MediaFolderOutput, typeof mediaFolderListFields>;
export type MediaFolderDetailColumns = Row<MediaFolderOutput, typeof mediaFolderDetailFields>;

export type MediaAssetListColumns = Row<MediaAssetOutput, typeof mediaAssetListFields>;
export type MediaAssetDetailColumns = Row<MediaAssetOutput, typeof mediaAssetDetailFields>;

export type MediaFileListColumns = Row<MediaFileOutput, typeof mediaFileListFiles>;
export type MediaFileDetailColumns = Row<MediaFileOutput, typeof mediaFileDetailFields>;

export type MediaVariantListColumns = Row<MediaVariantOutput, typeof mediaVariantListFields>;

export type MediaFolderListVO = Row<MediaFolderOutput, typeof mediaFolderListFields>;