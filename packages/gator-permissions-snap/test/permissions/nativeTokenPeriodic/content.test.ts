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
                "alignment": "space-between",
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
                        null,
                        {
                          "key": null,
                          "props": {
                            "children": "1",
                          },
                          "type": "Text",
                        },
                      ],
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
                      "children": [
                        null,
                        {
                          "key": null,
                          "props": {
                            "children": "Daily",
                          },
                          "type": "Text",
                        },
                      ],
                      "direction": "horizontal",
                    },
                    "type": "Box",
                  },
                ],
                "direction": "horizontal",
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
                "alignment": "space-between",
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
                                      "children": "The time at which the first period begins",
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
                        null,
                        {
                          "key": null,
                          "props": {
                            "children": "10/26/1985, 8:00:00 AM",
                          },
                          "type": "Text",
                        },
                      ],
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
                                      "children": "The expiry date of the permission",
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
                        null,
                        {
                          "key": null,
                          "props": {
                            "children": "5/1/2024, 12:00:00 AM",
                          },
                          "type": "Text",
                        },
                      ],
                      "direction": "horizontal",
                    },
                    "type": "Box",
                  },
                ],
                "direction": "horizontal",
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
