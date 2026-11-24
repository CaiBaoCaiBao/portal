import { FieldOutputTypes } from "@/prisma/contract";
import { columns } from "@/lib";
import { Row } from "./globals.type";

type MediaFolderOutput = FieldOutputTypes["public"]["MediaFolder"];
type MediaAssetOutput = FieldOutputTypes["public"]["MediaAsset"];
type FileVersionOutput = FieldOutputTypes["public"]["FileVersion"];
type MediaFileOutput = FieldOutputTypes["public"]["MediaFile"];
type MediaVariantOutput = FieldOutputTypes["public"]["MediaVariant"];

const folderColumns = columns<MediaFolderOutput>();
const assetColumns = columns<MediaAssetOutput>();
const fileVersionColumns = columns<FileVersionOutput>();
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
export const fileVersionListFields = fileVersionColumns("id", "assetId", "fileId", "version", "createdAt");
export const fileVersionDetailFields = fileVersionListFields;
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
    "status"
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
export type FileVersionListColumns = Row<FileVersionOutput, typeof fileVersionListFields>;
export type FileVersionDetailColumns = Row<FileVersionOutput, typeof fileVersionDetailFields>;
export type MediaFileDetailColumns = Row<MediaFileOutput, typeof mediaFileDetailFields>;
export type MediaVariantListColumns = Row<MediaVariantOutput, typeof variantListFields>;

export type MediaFolderListVO = Row<MediaFolderOutput, typeof mediaFolderListFields>;