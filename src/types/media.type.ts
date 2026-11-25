import { FieldOutputTypes } from "@/prisma/contract";
import { columns } from "@/lib";
import { Row } from "./globals.type";

type MediaFolderOutput = FieldOutputTypes["public"]["MediaFolder"];
type MediaAssetOutput = FieldOutputTypes["public"]["MediaAsset"];
type AssetVersionOutput = FieldOutputTypes["public"]["AssetVersion"];
type MediaFileOutput = FieldOutputTypes["public"]["MediaFile"];
type MediaVariantOutput = FieldOutputTypes["public"]["MediaVariant"];

const folderColumns = columns<MediaFolderOutput>();
const assetColumns = columns<MediaAssetOutput>();
const assetVersionColumns = columns<AssetVersionOutput>();
const fileColumns = columns<MediaFileOutput>();
const variantColumns = columns<MediaVariantOutput>();

export const mediaFolderListFields = folderColumns("id", "name");
export const mediaFolderDetailFields = mediaFolderListFields;
export const mediaAssetListFields = assetColumns(
    "id", "title", "folderId", "currentVersionId", "createdAt"
);
export const mediaAssetDetailFields = assetColumns(
    "id", "title", "folderId", "createdAt", "currentVersionId",
    "description", "status", "kind"
);
export const assetVersionListFields = assetVersionColumns("id", "assetId", "fileId", "version", "createdAt");
export const assetVersionDetailFields = assetVersionListFields;
export const mediaFileDetailFields = fileColumns(
    "id",
    "originalName",
    "storageKey",
    "url",
    "checksum",
    "mimeType",
    "size",
    "width",
    "height",
    "durationMs",
    "status",
    "updatedAt"
);
export const variantListFields = variantColumns(
    "id",
    "fileId",
    "height",
    "width",
    "purpose",
    "mime",
    "size",
    "status",
    "storageKey",
    "url",
);

export type MediaFolderListColumns = Row<MediaFolderOutput, typeof mediaFolderListFields>;
export type MediaFolderDetailColumns = Row<MediaFolderOutput, typeof mediaFolderDetailFields>;
export type MediaAssetListColumns = Row<MediaAssetOutput, typeof mediaAssetListFields>;
export type MediaAssetDetailColumns = Row<MediaAssetOutput, typeof mediaAssetDetailFields>;
export type AssetVersionListColumns = Row<AssetVersionOutput, typeof assetVersionListFields>;
export type AssetVersionDetailColumns = Row<AssetVersionOutput, typeof assetVersionDetailFields>;
export type MediaFileDetailColumns = Row<MediaFileOutput, typeof mediaFileDetailFields>;
export type MediaVariantListColumns = Row<MediaVariantOutput, typeof variantListFields>;

export type MediaFolderListVO = Row<MediaFolderOutput, typeof mediaFolderListFields>;