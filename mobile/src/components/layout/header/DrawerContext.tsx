import React, { createContext, useContext, useState } from 'react';

export interface DrawerCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
  headerHeight: number;
  setHeaderHeight: (h: number) => void;
  bottomNavHeight: number;
  setBottomNavHeight: (h: number) => void;
}

const DrawerContext = createContext<DrawerCtx>({
  open: false,
  setOpen: () => {},
  headerHeight: 0,
  setHeaderHeight: () => {},
  bottomNavHeight: 0,
  setBottomNavHeight: () => {},
});

export const useDrawer = () => useContext(DrawerContext);

export const DrawerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open,             setOpen]             = useState(false);
  const [headerHeight,     setHeaderHeight]     = useState(0);
  const [bottomNavHeight,  setBottomNavHeight]  = useState(0);

  return (
    <DrawerContext.Provider value={{ open, setOpen, headerHeight, setHeaderHeight, bottomNavHeight, setBottomNavHeight }}>
      {children}
    </DrawerContext.Provider>
  );
};
