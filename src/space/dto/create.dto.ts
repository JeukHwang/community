export type CreateRequestDto = {
  name: string;
  managerPassword: string;
  participantPassword: string;
  role: {
    name: string;
    isManager: boolean;
  }[];
  defaultRole: string;
};
