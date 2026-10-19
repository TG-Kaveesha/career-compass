export const jsonOptions = {
  versionKey: false,

   transform: (_doc: unknown, ret: any) => {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.passwordHash;
    return ret;
  },
};