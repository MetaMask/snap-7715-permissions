import { describe, expect, it } from '@jest/globals';

import { TimePeriod } from '../../../src/core/types';
import { createConfirmationContent } from '../../../src/permissions/nativeTokenPeriodic/content';
import type {
  NativeTokenPeriodicContext,
  NativeTokenPeriodicMetadata,
} from '../../../src/permissions/nativeTokenPeriodic/types';
import { TIME_PERIOD_TO_SECONDS } from '../../../src/utils/time';

const mockContext: NativeTokenPeriodicContext = {
  expiry: {
    timestamp: 1714521600, // 05/01/2024
    isAdjustmentAllowed: true,
  },
  isAdjustmentAllowed: true,
  justification: 'Permission to do periodic native token transfers',
  accountAddressCaip10: 'eip155:1:0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  tokenAddressCaip19:
    'eip155:1/erc20:0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  tokenMetadata: {
    symbol: 'ETH',
    decimals: 18,
    iconDataBase64: null,
  },
  permissionDetails: {
    periodAmount: '1',
    periodDuration: Number(TIME_PERIOD_TO_SECONDS[TimePeriod.DAILY]),
    startTime: 499161600, // 10/26/1985
  },
};

const mockMetadata: NativeTokenPeriodicMetadata = {
  validationErrors: {},
};

describe('nativeTokenPeriodic:content', () => {
  describe('createConfirmationContent()', () => {
    it('should render content with all permission details', async () => {
      const content = await createConfirmationContent({
        context: mockContext,
        metadata: mockMetadata,
      });

      expect(content).toMatchInlineSnapshot(`
{
  "key": null,
  "props": {
    "children": {
      "key": null,
      "props": {
        "children": [
          [
            {
              "key": null,
              "props": {
                "children": [
                  {
                    "key": null,
                    "props": {
                      "alignment": "space-between",
                      "children": [
                        {
                          "key": null,
                          "props": {
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Amount",
                                },
                                "type": "Text",
                              },
                              {
                                "key": null,
                                "props": {
                                  "children": {
                                    "key": null,
                                    "props": {
                                      "color": "muted",
                                      "name": "question",
                                      "size": "inherit",
                                    },
                                    "type": "Icon",
                                  },
                                  "content": {
                                    "key": null,
                                    "props": {
                                      "children": "The amount of tokens granted during each period",
                                    },
                                    "type": "Text",
                                  },
                                },
                                "type": "Tooltip",
                              },
                            ],
                            "direction": "horizontal",
                          },
                          "type": "Box",
                        },
                        null,
                      ],
                      "direction": "horizontal",
                    },
                    "type": "Box",
                  },
                  {
                    "key": null,
                    "props": {
                      "children": [
                        {
                          "key": null,
                          "props": {
                            "children": null,
                          },
                          "type": "Box",
                        },
                        {
                          "key": null,
                          "props": {
                            "name": "native-token-periodic-period-amount",
                            "type": "number",
                            "value": "1",
                          },
                          "type": "Input",
                        },
                        {
                          "key": null,
                          "props": {
                            "children": null,
                          },
                          "type": "Box",
                        },
                      ],
                    },
                    "type": "Field",
                  },
                ],
                "direction": "vertical",
              },
              "type": "Box",
            },
            {
              "key": null,
              "props": {
                "children": [
                  {
                    "key": null,
                    "props": {
                      "alignment": "space-between",
                      "children": [
                        {
                          "key": null,
                          "props": {
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Frequency",
                                },
                                "type": "Text",
                              },
                              {
                                "key": null,
                                "props": {
                                  "children": {
                                    "key": null,
                                    "props": {
                                      "color": "muted",
                                      "name": "question",
                                      "size": "inherit",
                                    },
                                    "type": "Icon",
                                  },
                                  "content": {
                                    "key": null,
                                    "props": {
                                      "children": "The duration of the period",
                                    },
                                    "type": "Text",
                                  },
                                },
                                "type": "Tooltip",
                              },
                            ],
                            "direction": "horizontal",
                          },
                          "type": "Box",
                        },
                        null,
                      ],
                      "direction": "horizontal",
                    },
                    "type": "Box",
                  },
                  {
                    "key": null,
                    "props": {
                      "children": {
                        "key": null,
                        "props": {
                          "children": [
                            {
                              "key": "hourly",
                              "props": {
                                "children": "Hourly",
                                "value": "hourly",
                              },
                              "type": "Option",
                            },
                            {
                              "key": "daily",
                              "props": {
                                "children": "Daily",
                                "value": "daily",
                              },
                              "type": "Option",
                            },
                            {
                              "key": "weekly",
                              "props": {
                                "children": "Weekly",
                                "value": "weekly",
                              },
                              "type": "Option",
                            },
                            {
                              "key": "biweekly",
                              "props": {
                                "children": "Biweekly",
                                "value": "biweekly",
                              },
                              "type": "Option",
                            },
                            {
                              "key": "monthly",
                              "props": {
                                "children": "Monthly",
                                "value": "monthly",
                              },
                              "type": "Option",
                            },
                            {
                              "key": "yearly",
                              "props": {
                                "children": "Yearly",
                                "value": "yearly",
                              },
                              "type": "Option",
                            },
                          ],
                          "name": "native-token-periodic-period-type",
                          "value": "daily",
                        },
                        "type": "Dropdown",
                      },
                    },
                    "type": "Field",
                  },
                ],
                "direction": "vertical",
              },
              "type": "Box",
            },
          ],
          {
            "key": null,
            "props": {},
            "type": "Divider",
          },
          [
            {
              "key": null,
              "props": {
                "children": [
                  {
                    "key": null,
                    "props": {
                      "alignment": "space-between",
                      "children": [
                        {
                          "key": null,
                          "props": {
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Start Time",
                                },
                                "type": "Text",
                              },
                              {
                                "key": null,
                                "props": {
                                  "children": {
                                    "key": null,
                                    "props": {
                                      "color": "muted",
                                      "name": "question",
                                      "size": "inherit",
                                    },
                                    "type": "Icon",
                                  },
                                  "content": {
                                    "key": null,
                                    "props": {
                                      "children": "The time at which the first period begins (mm/dd/yyyy hh:mm:ss).",
                                    },
                                    "type": "Text",
                                  },
                                },
                                "type": "Tooltip",
                              },
                            ],
                            "direction": "horizontal",
                          },
                          "type": "Box",
                        },
                        {
                          "key": null,
                          "props": {
                            "alignment": "end",
                            "children": {
                              "key": null,
                              "props": {
                                "children": "mm/dd/yyyy hh:mm:ss",
                                "color": "muted",
                                "size": "sm",
                              },
                              "type": "Text",
                            },
                            "direction": "horizontal",
                          },
                          "type": "Box",
                        },
                      ],
                      "direction": "horizontal",
                    },
                    "type": "Box",
                  },
                  {
                    "key": null,
                    "props": {
                      "alignment": "space-between",
                      "children": {
                        "key": null,
                        "props": {
                          "children": [
                            {
                              "key": null,
                              "props": {
                                "name": "native-token-periodic-start-date_date",
                                "placeholder": "mm/dd/yyyy",
                                "type": "text",
                                "value": "10/26/1985",
                              },
                              "type": "Input",
                            },
                            {
                              "key": null,
                              "props": {
                                "name": "native-token-periodic-start-date_time",
                                "placeholder": "HH:MM:SS",
                                "type": "text",
                                "value": "08:00:00",
                              },
                              "type": "Input",
                            },
                            {
                              "key": null,
                              "props": {
                                "alignment": "center",
                                "children": {
                                  "key": null,
                                  "props": {
                                    "alignment": "center",
                                    "children": "UTC",
                                  },
                                  "type": "Text",
                                },
                                "direction": "vertical",
                              },
                              "type": "Box",
                            },
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                      "direction": "horizontal",
                    },
                    "type": "Box",
                  },
                  {
                    "key": null,
                    "props": {
                      "children": [
                        null,
                        null,
                      ],
                    },
                    "type": "Box",
                  },
                ],
                "direction": "vertical",
              },
              "type": "Box",
            },
            {
              "key": null,
              "props": {
                "children": [
                  {
                    "key": null,
                    "props": {
                      "alignment": "space-between",
                      "children": [
                        {
                          "key": null,
                          "props": {
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Expiry",
                                },
                                "type": "Text",
                              },
                              {
                                "key": null,
                                "props": {
                                  "children": {
                                    "key": null,
                                    "props": {
                                      "color": "muted",
                                      "name": "question",
                                      "size": "inherit",
                                    },
                                    "type": "Icon",
                                  },
                                  "content": {
                                    "key": null,
                                    "props": {
                                      "children": "The expiry date of the permission (mm/dd/yyyy hh:mm:ss).",
                                    },
                                    "type": "Text",
                                  },
                                },
                                "type": "Tooltip",
                              },
                            ],
                            "direction": "horizontal",
                          },
                          "type": "Box",
                        },
                        {
                          "key": null,
                          "props": {
                            "alignment": "end",
                            "children": {
                              "key": null,
                              "props": {
                                "children": "mm/dd/yyyy hh:mm:ss",
                                "color": "muted",
                                "size": "sm",
                              },
                              "type": "Text",
                            },
                            "direction": "horizontal",
                          },
                          "type": "Box",
                        },
                      ],
                      "direction": "horizontal",
                    },
                    "type": "Box",
                  },
                  {
                    "key": null,
                    "props": {
                      "alignment": "space-between",
                      "children": {
                        "key": null,
                        "props": {
                          "children": [
                            {
                              "key": null,
                              "props": {
                                "name": "native-token-periodic-expiry_date",
                                "placeholder": "mm/dd/yyyy",
                                "type": "text",
                                "value": "05/01/2024",
                              },
                              "type": "Input",
                            },
                            {
                              "key": null,
                              "props": {
                                "name": "native-token-periodic-expiry_time",
                                "placeholder": "HH:MM:SS",
                                "type": "text",
                                "value": "00:00:00",
                              },
                              "type": "Input",
                            },
                            {
                              "key": null,
                              "props": {
                                "alignment": "center",
                                "children": {
                                  "key": null,
                                  "props": {
                                    "alignment": "center",
                                    "children": "UTC",
                                  },
                                  "type": "Text",
                                },
                                "direction": "vertical",
                              },
                              "type": "Box",
                            },
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                      "direction": "horizontal",
                    },
                    "type": "Box",
                  },
                  {
                    "key": null,
                    "props": {
                      "children": [
                        null,
                        null,
                      ],
                    },
                    "type": "Box",
                  },
                ],
                "direction": "vertical",
              },
              "type": "Box",
            },
          ],
        ],
      },
      "type": "Section",
    },
  },
  "type": "Box",
}
`);
    });
  });
});
