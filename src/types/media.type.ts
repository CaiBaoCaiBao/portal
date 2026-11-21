import { FieldOutputTypes } from "@/prisma/contract";
import { columns } from "@/lib";
import { Row } from "./globals.type";

type MediaFolderOutput = FieldOutputTypes["public"]["MediaFolder"];

const folderColumns = columns<MediaFolderOutput>();

export const mediaFolderListFields = folderColumns("id", "name");
export type MediaFolderColumns = Row<MediaFolderOutput, typeof mediaFolderListFields>;
export type MediaFolderListVO = Row<MediaFolderOutput, typeof mediaFolderListFields>;