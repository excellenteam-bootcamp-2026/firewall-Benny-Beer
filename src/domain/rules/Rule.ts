import { RuleType } from './RuleTypes';

export abstract class Rule {
  constructor(
    readonly value : string | number,
    private _active: boolean = true,
  ) {}

  get active(): boolean {
    return this._active;
  }

  deactivate(): void {
    this._active = false;
  }

  activate(): void {
    this._active = true;
  }

  abstract readonly type: RuleType;

  // --- Registry machinery ---

  private static registry = new Map<RuleType, RuleConstructor>();

  /** Called by each subclass, once, to register itself under its type tag. */
  static register(type: RuleType, ctor: RuleConstructor): void {
    Rule.registry.set(type, ctor);
  }

  /** Generic factory — looks up the right subclass by type and delegates. */
  static build(type: RuleType, rawValue: string | number, active?: boolean): Rule {
    const ctor = Rule.registry.get(type);
    if (!ctor) {
        throw new Error(`No Rule class registered for type "${type}"`);
    }
    return ctor.create(rawValue, active);
    }
}

/** The shape every concrete Rule subclass's static side must satisfy. */
export interface RuleConstructor {
  create(rawValue: string | number, active?: boolean): Rule;

}