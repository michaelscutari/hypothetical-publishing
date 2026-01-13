import * as React from 'react';

export interface OpenDialogOptions<R> {
  onClose?: (result: R) => Promise<void>;
}

export interface DialogProps<P = undefined, R = void> {
  payload: P;
  open: boolean;
  onClose: (result: R) => Promise<void>;
}

export type DialogComponent<P, R> = React.ComponentType<DialogProps<P, R>>;

export interface OpenDialog {
  <P extends undefined, R>(
    Component: DialogComponent<P, R>,
    payload?: P,
    options?: OpenDialogOptions<R>,
  ): Promise<R>;
  <P, R>(
    Component: DialogComponent<P, R>,
    payload: P,
    options?: OpenDialogOptions<R>,
  ): Promise<R>;
}

export interface CloseDialog {
  <R>(dialog: Promise<R>, result: R): Promise<R>;
}

const DialogsContext = React.createContext<{
  open: OpenDialog;
  close: CloseDialog;
} | null>(null);

export default DialogsContext;
