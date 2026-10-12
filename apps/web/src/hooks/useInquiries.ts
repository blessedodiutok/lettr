"use client";

export {
  useCreateInquiry as useSendInquiry,
  useInquiry,
  useMyInquiries,
  useMyInquiries as useMyTenantInquiries,
  useScheduleInspection,
  useSendMessage as useReplyToInquiry,
} from "./useMessages";
export type { InquiryThread as Inquiry, InquiryMessage } from "./useMessages";
