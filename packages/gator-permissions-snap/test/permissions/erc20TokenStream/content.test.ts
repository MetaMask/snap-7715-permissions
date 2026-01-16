import { describe, expect, it } from '@jest/globals';

import { TimePeriod } from '../../../src/core/types';
import { createConfirmationContent } from '../../../src/permissions/erc20TokenStream/content';
import type {
  Erc20TokenStreamContext,
  Erc20TokenStreamMetadata,
} from '../../../src/permissions/erc20TokenStream/types';

const tokenDecimals = 10;

const mockContext: Erc20TokenStreamContext = {
  expiry: {
    timestamp: 1714521600, // 05/01/2024
  },
  isAdjustmentAllowed: true,
  justification: 'Permission to stream ERC20 tokens',
  accountAddressCaip10: `eip155:1:0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`,
  tokenAddressCaip19: `eip155:1/erc20:0xA0b86a33E6417efb4e0Ba2b1e4E6FE87bbEf2B0F`,
  tokenMetadata: {
    symbol: 'USDC',
    decimals: tokenDecimals,
    iconDataBase64:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  },
  permissionDetails: {
    initialAmount: '1',
    maxAmount: '10',
    timePeriod: TimePeriod.WEEKLY,
    startTime: 499161600, // 10/26/1985
    amountPerPeriod: '302400',
  },
};

const mockMetadata: Erc20TokenStreamMetadata = {
  amountPerSecond: '0.5',
  validationErrors: {},
};

describe('erc20TokenStream:content', () => {
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
    "children": [
      {
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
                                    "children": "Initial Amount",
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
                                        "children": "The initial amount of tokens that can be streamed.",
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
                              "alt": "USDC",
                              "src": "<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" width="24" height="24" />
  </svg>",
                            },
                            "type": "Image",
                          },
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
                                    "children": "Max Amount",
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
                                        "children": "The maximum amount of tokens that can be streamed.",
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
                              "alt": "USDC",
                              "src": "<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" width="24" height="24" />
  </svg>",
                            },
                            "type": "Image",
                          },
                          {
                            "key": null,
                            "props": {
                              "children": "10",
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
                                        "children": "The start time of the stream",
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
      {
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
                                    "children": "Stream Amount",
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
                                        "children": "The amount of tokens that can be streamed per period.",
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
                              "alt": "USDC",
                              "src": "<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" width="24" height="24" />
  </svg>",
                            },
                            "type": "Image",
                          },
                          {
                            "key": null,
                            "props": {
                              "children": "302400",
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
                                    "children": "Stream Period",
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
                                        "children": "The period of the stream.",
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
                              "children": "Weekly",
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
              "props": {
                "children": [
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
                                "children": "Stream rate",
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
                                    "children": "The amount of tokens to stream per second.",
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
                            "children": {
                              "key": null,
                              "props": {
                                "alt": "USDC",
                                "src": "<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" width="24" height="24" />
  </svg>",
                              },
                              "type": "Image",
                            },
                          },
                          "type": "Box",
                        },
                        {
                          "key": null,
                          "props": {
                            "disabled": true,
                            "name": "stream-rate",
                            "type": "text",
                            "value": "0.5 USDC/sec",
                          },
                          "type": "Input",
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
          ],
        },
        "type": "Section",
      },
    ],
  },
  "type": "Box",
}
`);
    });

    it('should render content with validation errors', async () => {
      const content = await createConfirmationContent({
        context: mockContext,
        metadata: {
          ...mockMetadata,
          validationErrors: {
            initialAmountError: 'Invalid initial amount',
            maxAmountError: 'Invalid max amount',
            amountPerPeriodError: 'Invalid amount per period',
            startTimeError: 'Invalid start time',
            expiryError: 'Invalid expiry',
          },
        },
      });

      expect(content).toMatchInlineSnapshot(`
{
  "key": null,
  "props": {
    "children": [
      {
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
                                    "children": "Initial Amount",
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
                                        "children": "The initial amount of tokens that can be streamed.",
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
                              "alt": "USDC",
                              "src": "<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" width="24" height="24" />
  </svg>",
                            },
                            "type": "Image",
                          },
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
                                    "children": "Max Amount",
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
                                        "children": "The maximum amount of tokens that can be streamed.",
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
                              "alt": "USDC",
                              "src": "<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" width="24" height="24" />
  </svg>",
                            },
                            "type": "Image",
                          },
                          {
                            "key": null,
                            "props": {
                              "children": "10",
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
                                        "children": "The start time of the stream",
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
      {
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
                                    "children": "Stream Amount",
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
                                        "children": "The amount of tokens that can be streamed per period.",
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
                              "alt": "USDC",
                              "src": "<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" width="24" height="24" />
  </svg>",
                            },
                            "type": "Image",
                          },
                          {
                            "key": null,
                            "props": {
                              "children": "302400",
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
                                    "children": "Stream Period",
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
                                        "children": "The period of the stream.",
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
                              "children": "Weekly",
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
              "props": {
                "children": [
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
                                "children": "Stream rate",
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
                                    "children": "The amount of tokens to stream per second.",
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
                            "children": {
                              "key": null,
                              "props": {
                                "alt": "USDC",
                                "src": "<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" width="24" height="24" />
  </svg>",
                              },
                              "type": "Image",
                            },
                          },
                          "type": "Box",
                        },
                        {
                          "key": null,
                          "props": {
                            "disabled": true,
                            "name": "stream-rate",
                            "type": "text",
                            "value": "0.5 USDC/sec",
                          },
                          "type": "Input",
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
          ],
        },
        "type": "Section",
      },
    ],
  },
  "type": "Box",
}
`);
    });
  });
});
