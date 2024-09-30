export interface IState {
  data?: Record<string, any>
  hooks?: Record<string, Array<Function>>
}

export interface ILilComponentProps extends IState {
  name: string;
  template: string;
  handlers?: Record<string, Function>;
}

export function lilComponent(props: ILilComponentProps): void;
export function parseTemplate(template: string, state: Record<string, any>): string;
export function stateObject(context: any, config: IState): Record<string, any>;