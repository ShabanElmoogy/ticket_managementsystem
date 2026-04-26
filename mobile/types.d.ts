/// <reference types="react" />
/// <reference types="react-native" />

declare module 'react' {
  export function useState<S>(initialState: S | (() => S)): [S, React.Dispatch<React.SetStateAction<S>>];
  export function useState<S = undefined>(): [S | undefined, React.Dispatch<React.SetStateAction<S | undefined>>];
  
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: React.DependencyList): T;
  export function useMemo<T>(factory: () => T, deps: React.DependencyList | undefined): T;
  export function useRef<T>(initialValue: T): React.MutableRefObject<T>;
  export function useRef<T>(initialValue: T | null): React.RefObject<T>;
  export function useRef<T = undefined>(): React.MutableRefObject<T | undefined>;
  export function memo<P extends object>(Component: React.FunctionComponent<P>): React.FunctionComponent<P>;
  export function createContext<T>(defaultValue: T): React.Context<T>;
  export function useContext<T>(context: React.Context<T>): T;
  export function useEffect(effect: React.EffectCallback, deps?: React.DependencyList): void;
  
  export function isValidElement(object: any): object is React.ReactElement;
  export function cloneElement<P>(element: React.ReactElement<P>, props?: Partial<P> & React.Attributes, ...children: React.ReactNode[]): React.ReactElement<P>;
  
  export const Children: {
    map<T, C>(children: C | ReadonlyArray<C>, fn: (child: C, index: number) => T): C extends null | undefined ? C : Array<Exclude<T, boolean | null | undefined>>;
    forEach<C>(children: C | ReadonlyArray<C>, fn: (child: C, index: number) => void): void;
    count(children: any): number;
    only<C>(children: C): C extends any[] ? never : C;
    toArray(children: React.ReactNode | React.ReactNode[]): React.ReactChild[];
  };
  
  export interface FunctionComponent<P = {}> {
    (props: P): React.ReactElement<any, any> | null;
    displayName?: string | undefined;
  }
  
  export type FC<P = {}> = FunctionComponent<P>;
  export type ReactNode = React.ReactChild | React.ReactFragment | React.ReactPortal | boolean | null | undefined;
  export type ReactElement<P = any, T extends string | React.JSXElementConstructor<any> = string | React.JSXElementConstructor<any>> = {
    type: T;
    props: P;
    key: React.Key | null;
  };
  export type DependencyList = ReadonlyArray<any>;
  export type MutableRefObject<T> = { current: T };
  export type RefObject<T> = { readonly current: T | null };
  export type Context<T> = { Provider: React.ComponentType<{ value: T; children?: React.ReactNode }>; Consumer: React.ComponentType<{ children: (value: T) => React.ReactNode }> };
  export type EffectCallback = () => (void | (() => void | undefined));
}

// Extend React Native JSX namespace
declare module 'react-native' {
  import { ComponentType } from 'react';
  
  export interface ViewStyle {
    flex?: number;
    flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
    alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
    justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
    backgroundColor?: string;
    borderBottomWidth?: number;
    borderBottomColor?: string;
    borderRadius?: number;
    paddingHorizontal?: number;
    paddingVertical?: number;
    gap?: number;
    [key: string]: any;
  }

  export interface TextStyle extends ViewStyle {
    fontSize?: number;
    fontWeight?: string | number;
    color?: string;
  }

  export interface ViewProps {
    style?: ViewStyle | ViewStyle[];
    children?: React.ReactNode;
    [key: string]: any;
  }

  export interface TextProps {
    style?: TextStyle | TextStyle[];
    children?: React.ReactNode;
    numberOfLines?: number;
    [key: string]: any;
  }

  export interface PressableProps {
    onPress?: () => void;
    style?: ViewStyle | ViewStyle[] | ((state: any) => ViewStyle | ViewStyle[]);
    children?: React.ReactNode;
    [key: string]: any;
  }

  export interface ScrollViewProps {
    horizontal?: boolean;
    showsHorizontalScrollIndicator?: boolean;
    contentContainerStyle?: ViewStyle;
    children?: React.ReactNode;
    ref?: React.RefObject<any>;
    [key: string]: any;
  }

  export interface ActivityIndicatorProps {
    size?: 'small' | 'large' | number;
    color?: string;
    animating?: boolean;
    [key: string]: any;
  }

  export interface ModalProps {
    visible?: boolean;
    transparent?: boolean;
    animationType?: 'none' | 'slide' | 'fade';
    onRequestClose?: () => void;
    statusBarTranslucent?: boolean;
    children?: React.ReactNode;
    [key: string]: any;
  }

  export interface KeyboardAvoidingViewProps {
    behavior?: 'height' | 'position' | 'padding';
    keyboardVerticalOffset?: number;
    children?: React.ReactNode;
    [key: string]: any;
  }

  export const View: ComponentType<ViewProps>;
  export const Text: ComponentType<TextProps>;
  export const Pressable: ComponentType<PressableProps>;
  export const ScrollView: ComponentType<ScrollViewProps>;
  export const ActivityIndicator: ComponentType<ActivityIndicatorProps>;
  export const Modal: ComponentType<ModalProps>;
  export const KeyboardAvoidingView: ComponentType<KeyboardAvoidingViewProps>;
  export const StyleSheet: {
    create: <T extends Record<string, ViewStyle | TextStyle>>(styles: T) => T;
    absoluteFillObject: ViewStyle;
    [key: string]: any;
  };
  export const Platform: {
    OS: 'ios' | 'android' | 'windows' | 'macos' | 'web';
    [key: string]: any;
  };
  export const Keyboard: {
    addListener: (eventName: string, callback: (event: any) => void) => { remove: () => void };
    removeListener: (eventName: string, callback: (event: any) => void) => void;
    removeAllListeners: (eventName?: string) => void;
    dismiss: () => void;
    [key: string]: any;
  };
  export function useWindowDimensions(): { width: number; height: number; scale: number; fontScale: number };
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}