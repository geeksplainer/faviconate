// eslint-disable-next-line max-classes-per-file
interface EditorTransaction<T> {
  documentState: T;
}

export class NoTransactionError extends Error {}
export class TransactionInProgressError extends Error {}
export class UnsavedChangesError extends Error {}

export class Editor<T> {
  private _currentTransaction: EditorTransaction<T> | null = null;
  private _document: T;
  private _hasChanges = false;
  private _pristine = true;
  private readonly undoStack: EditorTransaction<T>[] = [];
  private readonly redoStack: EditorTransaction<T>[] = [];

  public documentChanged: (() => void) | null = null;
  public documentSubmitted: (() => void) | null = null;

  constructor(document: T) {
    this._document = document;
  }

  redo(): boolean {
    if (this.redoStack.length === 0) {
      return false;
    }

    const top = this.redoStack.pop();

    if (top) {
      this.undoStack.push({ documentState: this.document });
      this._document = top.documentState;

      if (this.documentSubmitted) {
        this.documentSubmitted();
      }
    }

    return true;
  }

  undo(): boolean {
    if (this.undoStack.length === 0) {
      return false;
    }

    const top = this.undoStack.pop();

    if (top) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.redoStack.push({ documentState: this.document! });
      this._document = top.documentState;

      if (this.documentSubmitted) {
        this.documentSubmitted();
      }
    }

    return true;
  }

  begin() {
    if (this._currentTransaction) {
      throw new TransactionInProgressError();
    } else {
      this._currentTransaction = { documentState: this._document };
    }
  }

  setDocument(document: T) {
    if (this._currentTransaction) {
      this._document = document;

      if (this.documentChanged) {
        this.documentChanged();
      }
    } else {
      throw new NoTransactionError();
    }
  }

  commit(document?: T) {
    if (!this._currentTransaction) {
      throw new NoTransactionError();
    }

    if (document) {
      this.setDocument(document);
    }

    // Push to undo stack
    this.undoStack.push(this._currentTransaction);

    // Clear transaction
    this._currentTransaction = null;

    // Empty redo stack
    while (this.redoStack.length > 0) {
      this.redoStack.pop();
    }

    // We have changes
    this._hasChanges = true;

    this._pristine = false;

    if (this.documentSubmitted) {
      this.documentSubmitted();
    }
  }

  rollback() {
    if (this._currentTransaction) {
      this._document = this._currentTransaction.documentState;
      this._currentTransaction = null;

      if (this.documentSubmitted) {
        this.documentSubmitted();
      }
    } else {
      throw new NoTransactionError();
    }
  }

  clearChanges() {
    this._hasChanges = false;
  }

  transact(document: T) {
    this.begin();
    this.commit(document);
  }

  get currentTransaction(): EditorTransaction<T> | null {
    return this._currentTransaction;
  }

  get document(): T {
    return this._document;
  }

  get hasChanges(): boolean {
    return this._hasChanges;
  }

  get pristine(): boolean {
    return this._pristine;
  }

  get redoCount(): number {
    return this.redoStack.length;
  }

  get redoPeek(): T | null {
    if (this.redoStack.length > 0) {
      return this.redoStack[this.redoStack.length - 1].documentState;
    }
    return null;
  }

  get undoCount(): number {
    return this.undoStack.length;
  }

  get undoPeek(): T | null {
    if (this.undoStack.length > 0) {
      return this.undoStack[this.undoStack.length - 1].documentState;
    }
    return null;
  }
}
