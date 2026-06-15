import { z } from "zod";
import { ID_REGEX } from "@/lib/auth/ids";

const idField = z
  .string()
  .trim()
  .regex(ID_REGEX, "아이디는 영문·숫자 3~20자예요");

export const LoginSchema = z.object({
  loginId: idField,
  password: z.string().min(6, "비밀번호는 6자 이상이에요"),
});

export const SignupSchema = z
  .object({
    name: z.string().trim().min(1, "이름을 적어주세요").max(20, "이름이 너무 길어요"),
    loginId: idField,
    password: z.string().min(6, "비밀번호는 6자 이상이에요"),
    confirmPassword: z.string(),
    role: z.enum(["parent", "grandparent", "manager"]).default("parent"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "비밀번호가 일치하지 않아요",
  });

export const ConnectCodeSchema = z.object({
  code: z.string().trim().min(4, "코드 4자리를 입력하세요").max(8),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type SignupInput = z.infer<typeof SignupSchema>;
