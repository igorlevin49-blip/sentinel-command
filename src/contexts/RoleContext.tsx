import { createContext, useContext, useState, type ReactNode } from 'react';
import type { UserRole } from '@/types/soms';

interface RoleContextValue {
  role: UserRole;
  setRole: (role: UserRole) => void;
  userName: string;
  userTitle: string;
}

const roleProfiles: Record<UserRole, { name: string; title: string }> = {
  super_admin: { name: 'Системный Администратор', title: 'QOR Super Admin' },
  org_admin: { name: 'Лебедев Е.А.', title: 'Администратор' },
  dispatcher: { name: 'Волков А.С.', title: 'Диспетчер' },
  chief: { name: 'Козлов А.В.', title: 'Нач. охраны' },
  guard: { name: 'Петров Д.А.', title: 'Охранник' },
  client: { name: 'Смирнов И.П.', title: 'Заказчик' },
  director: { name: 'Орлов В.М.', title: 'Директор' },
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>('dispatcher');

  const profile = roleProfiles[role];

  return (
    <RoleContext.Provider
      value={{
        role,
        setRole,
        userName: profile.name,
        userTitle: profile.title,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
}

export { roleProfiles };
