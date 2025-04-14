import { parseUnits, toHex } from 'viem';

import type {
  RuleMeta,
  RuleValidationTypes,
} from '../../../../src/ui/components/Rules/Rules';
import {
  getOrderedOptions,
  isInputHidden,
  renderUnlimitedAllowanceDropDown,
  validator,
} from '../../../../src/ui/components/Rules/RulesSelector';

describe('RulesSelector', () => {
  const mockRuleMeta: RuleMeta<RuleValidationTypes> = {
    stateKey: 'testKey',
    name: 'Test Rule',
    placeholder: 'Enter value',
    ruleValidator: {
      validationType: 'value',
      emptyInputValidationError: 'Value cannot be empty',
      inputConstraintValidationError: 'Value exceeds limit',
      compareValue: toHex(parseUnits('1', 18)),
    },
  };

  describe('validator', () => {
    it('should return empty input error when input is empty', () => {
      const result = validator('', mockRuleMeta);
      expect(result).toBe('Value cannot be empty');
    });

    it('should return constraint error is value exceeds limit', () => {
      const result = validator('2', mockRuleMeta);
      expect(result).toBe('Value exceeds limit');
    });

    it('should return undefined when value is valid', () => {
      const result = validator('.5', mockRuleMeta);
      expect(result).toBeUndefined();
    });

    it('should handle undefined when timestamp is valid', () => {
      const timestampRuleMeta: RuleMeta<RuleValidationTypes> = {
        ...mockRuleMeta,
        ruleValidator: {
          validationType: 'timestamp',
          emptyInputValidationError: 'Date cannot be empty',
          inputConstraintValidationError: 'Date is invalid',
          compareValue: 1744308258, // 04/11/2025
        },
      };

      // timestamp is valid since it is after the compareValue
      const result = validator('04/11/2025', timestampRuleMeta);
      expect(result).toBeUndefined();
    });

    it('should return constraint error when timestamp is invalid', () => {
      const timestampRuleMeta: RuleMeta<RuleValidationTypes> = {
        ...mockRuleMeta,
        ruleValidator: {
          validationType: 'timestamp',
          emptyInputValidationError: 'Date cannot be empty',
          inputConstraintValidationError: 'Date is invalid',
          compareValue: 1744308258, // 04/11/2025
        },
      };

      // timestamp is invalid since it is before the compareValue
      const result = validator('04/11/2024', timestampRuleMeta);
      expect(result).toBe('Date is invalid');
    });
  });

  describe('renderUnlimitedAllowanceDropDown', () => {
    it('should return null when unlimitedAllowanceDropDown is not present', () => {
      const result = renderUnlimitedAllowanceDropDown(mockRuleMeta, 'testKey');
      expect(result).toBeNull();
    });

    it('should return null when activeRuleDropDownValue does not match stateKey', () => {
      const ruleWithUnlimited: RuleMeta<RuleValidationTypes> = {
        ...mockRuleMeta,
        ruleValidator: {
          ...mockRuleMeta.ruleValidator,
          unlimitedAllowanceDropDown: {
            dropdownKey: 'testDropdown',
            dropdownValue: 'Specify',
          },
        },
      };

      const result = renderUnlimitedAllowanceDropDown(
        ruleWithUnlimited,
        'differentKey',
      );
      expect(result).toBeNull();
    });

    it('should render dropdown when conditions are met', () => {
      const ruleWithUnlimited: RuleMeta<RuleValidationTypes> = {
        ...mockRuleMeta,
        ruleValidator: {
          ...mockRuleMeta.ruleValidator,
          unlimitedAllowanceDropDown: {
            dropdownKey: 'testDropdown',
            dropdownValue: 'Specify',
          },
        },
      };

      const result = renderUnlimitedAllowanceDropDown(
        ruleWithUnlimited,
        'testKey',
      );
      expect(result).not.toBeNull();
    });
  });

  describe('isInputHidden', () => {
    it('should return false when unlimitedAllowanceDropDown is not present', () => {
      const result = isInputHidden(mockRuleMeta);
      expect(result).toBe(false);
    });

    it('should return true when dropdownValue is Unlimited', () => {
      const ruleWithUnlimited: RuleMeta<RuleValidationTypes> = {
        ...mockRuleMeta,
        ruleValidator: {
          ...mockRuleMeta.ruleValidator,
          unlimitedAllowanceDropDown: {
            dropdownKey: 'testDropdown',
            dropdownValue: 'Unlimited',
          },
        },
      };

      const result = isInputHidden(ruleWithUnlimited);
      expect(result).toBe(true);
    });

    it('should return false when dropdownValue is not Unlimited', () => {
      const ruleWithUnlimited: RuleMeta<RuleValidationTypes> = {
        ...mockRuleMeta,
        ruleValidator: {
          ...mockRuleMeta.ruleValidator,
          unlimitedAllowanceDropDown: {
            dropdownKey: 'testDropdown',
            dropdownValue: 'Specify',
          },
        },
      };

      const result = isInputHidden(ruleWithUnlimited);
      expect(result).toBe(false);
    });
  });

  describe('getOrderedOptions', () => {
    const mockRuleMetaList: RuleMeta<RuleValidationTypes>[] = [
      mockRuleMeta,
      {
        stateKey: 'secondKey',
        name: 'Second Rule',
        placeholder: 'Enter value',
        ruleValidator: {
          validationType: 'value',
          emptyInputValidationError: 'Value cannot be empty',
          inputConstraintValidationError: 'Value exceeds limit',
          compareValue: '0x100' as const,
        },
      },
    ];

    it('should throw error when rule meta is not found', () => {
      expect(() =>
        getOrderedOptions('nonExistentKey', mockRuleMetaList),
      ).toThrow('Found rule meta is undefined');
    });

    it('should return ordered options with selected rule first', () => {
      const result = getOrderedOptions('secondKey', mockRuleMetaList);
      expect(result[0]?.stateKey).toBe('secondKey');
      expect(result[1]?.stateKey).toBe('testKey');
    });
  });
});
