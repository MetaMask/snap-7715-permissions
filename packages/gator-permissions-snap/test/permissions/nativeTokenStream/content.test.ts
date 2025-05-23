import { describe, expect, it } from '@jest/globals';
import { toHex, parseUnits } from 'viem/utils';

import { TimePeriod } from '../../../src/core/types';
import { createConfirmationContent } from '../../../src/permissions/nativeTokenStream/content';
import type {
  NativeTokenStreamContext,
  NativeTokenStreamMetadata,
} from '../../../src/permissions/nativeTokenStream/types';

const mockContext: NativeTokenStreamContext = {
  expiry: '05/01/2024',
  isAdjustmentAllowed: true,
  accountDetails: {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    balance: toHex(parseUnits('10', 18)),
    balanceFormattedAsCurrency: '$🐊10.00',
  },
  permissionDetails: {
    initialAmount: '1',
    maxAmount: '10',
    timePeriod: TimePeriod.WEEKLY,
    startTime: '10/26/1985',
    amountPerPeriod: '302400',
  },
};

const mockMetadata: NativeTokenStreamMetadata = {
  amountPerSecond: '0.5',
  validationErrors: {},
  rulesToAdd: [],
};

describe('nativeTokenStream:content', () => {
  describe('createConfirmationContent()', () => {
    it('should render content with all permission details', () => {
      const content = createConfirmationContent({
        context: mockContext,
        metadata: mockMetadata,
        isJustificationCollapsed: true,
        showAddMoreRulesButton: false,
        origin: 'https://example.com',
        chainId: 1,
      });

      expect(content).toMatchInlineSnapshot(`
{
  "key": null,
  "props": {
    "children": {
      "key": null,
      "props": {
        "children": [
          {
            "key": null,
            "props": {
              "center": true,
              "children": {
                "key": null,
                "props": {
                  "children": "Native token stream",
                  "size": "lg",
                },
                "type": "Heading",
              },
            },
            "type": "Box",
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
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Recipient",
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
                                      "children": "The site requesting the permission",
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
                            "children": [
                              null,
                              {
                                "key": null,
                                "props": {
                                  "children": "https://example.com",
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
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Network",
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
                                      "children": "The network on which the permission is being requested",
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
                            "children": [
                              null,
                              {
                                "key": null,
                                "props": {
                                  "children": "Ethereum",
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
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Token",
                                },
                                "type": "Text",
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
                                  "alt": "ETH",
                                  "src": "<svg width="16" height="16" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<circle cx="16" cy="16" r="16" fill="#F2F4F6"/>
<circle cx="16" cy="16" r="15.5" stroke="#B7BBC8" stroke-opacity="0.4"/>
<g clip-path="url(#clip0_373_6813)">
<rect width="32" height="32" fill="url(#pattern0_373_6813)"/>
</g>
<defs>
<pattern id="pattern0_373_6813" patternContentUnits="objectBoundingBox" width="1" height="1">
<use xlink:href="#image0_373_6813" transform="scale(0.0166667)"/>
</pattern>
<clipPath id="clip0_373_6813">
<rect width="32" height="32" rx="16" fill="white"/>
</clipPath>
<image id="image0_373_6813" width="60" height="60" preserveAspectRatio="none" xlink:href="data:image/png;base64,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"/>
</defs>
</svg>
",
                                },
                                "type": "Image",
                              },
                              {
                                "key": null,
                                "props": {
                                  "children": "ETH",
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
                    "alignment": "space-between",
                    "children": [
                      {
                        "key": null,
                        "props": {
                          "children": [
                            {
                              "key": null,
                              "props": {
                                "children": "Reason",
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
                                    "children": "Reason given by the recipient for requesting this token stream allowance.",
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
                          "children": {
                            "key": null,
                            "props": {
                              "children": [
                                {
                                  "key": null,
                                  "props": {
                                    "children": "Permission to str...",
                                    "color": "muted",
                                  },
                                  "type": "Text",
                                },
                                {
                                  "key": null,
                                  "props": {
                                    "alignment": "end",
                                    "children": {
                                      "key": null,
                                      "props": {
                                        "children": "Show",
                                        "name": "justification-show-more",
                                      },
                                      "type": "Button",
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
            },
            "type": "Section",
          },
          {
            "key": null,
            "props": {
              "children": {
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
                                    "children": "Stream from",
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
                                        "children": "The account that the token stream comes from.",
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
                              "children": [
                                {
                                  "key": null,
                                  "props": {
                                    "address": "eip155:1:0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                                    "size": "sm",
                                  },
                                  "type": "Avatar",
                                },
                                {
                                  "key": null,
                                  "props": {
                                    "children": "Gator Account",
                                    "color": "default",
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
                        "alignment": "end",
                        "children": [
                          {
                            "key": null,
                            "props": {
                              "children": "$🐊10.00",
                              "color": "muted",
                            },
                            "type": "Text",
                          },
                          {
                            "key": null,
                            "props": {
                              "children": [
                                "10",
                                " available",
                              ],
                              "color": "alternative",
                            },
                            "type": "Text",
                          },
                        ],
                        "direction": "horizontal",
                      },
                      "type": "Box",
                    },
                  ],
                  "direction": "vertical",
                },
                "type": "Box",
              },
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
                            "name": "native-token-stream-amount-per-period",
                            "type": "number",
                            "value": "302400",
                          },
                          "type": "Input",
                        },
                        null,
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
                            "children": {
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
                            "direction": "horizontal",
                          },
                          "type": "Box",
                        },
                        {
                          "key": null,
                          "props": {
                            "children": [
                              {
                                "key": "Daily",
                                "props": {
                                  "children": "Daily",
                                  "value": "Daily",
                                },
                                "type": "Option",
                              },
                              {
                                "key": "Weekly",
                                "props": {
                                  "children": "Weekly",
                                  "value": "Weekly",
                                },
                                "type": "Option",
                              },
                              {
                                "key": "Monthly",
                                "props": {
                                  "children": "Monthly",
                                  "value": "Monthly",
                                },
                                "type": "Option",
                              },
                            ],
                            "name": "native-token-stream-time-period",
                            "value": "Weekly",
                          },
                          "type": "Dropdown",
                        },
                        null,
                      ],
                      "direction": "vertical",
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
                          "disabled": true,
                          "name": "stream-rate",
                          "type": "text",
                          "value": "0.5 ETH/sec",
                        },
                        "type": "Input",
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
          {
            "key": null,
            "props": {
              "children": [
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
                            {
                              "key": null,
                              "props": {
                                "children": "Remove",
                                "name": "native-token-stream-initial-amount_removeButton",
                                "type": "button",
                              },
                              "type": "Button",
                            },
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                      {
                        "key": null,
                        "props": {
                          "name": "native-token-stream-initial-amount",
                          "type": "number",
                          "value": "1",
                        },
                        "type": "Input",
                      },
                      null,
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
                            {
                              "key": null,
                              "props": {
                                "children": "Remove",
                                "name": "native-token-stream-max-amount_removeButton",
                                "type": "button",
                              },
                              "type": "Button",
                            },
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                      {
                        "key": null,
                        "props": {
                          "name": "native-token-stream-max-amount",
                          "type": "number",
                          "value": "10",
                        },
                        "type": "Input",
                      },
                      null,
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
                                          "children": "The start time of the stream.",
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
                          "name": "native-token-stream-start-time",
                          "type": "text",
                          "value": "10/26/1985",
                        },
                        "type": "Input",
                      },
                      null,
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
                                          "children": "The expiry date of the stream.",
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
                          "name": "native-token-stream-expiry",
                          "type": "text",
                          "value": "05/01/2024",
                        },
                        "type": "Input",
                      },
                      null,
                    ],
                    "direction": "vertical",
                  },
                  "type": "Box",
                },
              ],
            },
            "type": "Section",
          },
          null,
        ],
        "direction": "vertical",
      },
      "type": "Box",
    },
  },
  "type": "Box",
}
`);
    });

    it('should render content with validation errors', () => {
      const contentWithErrors = createConfirmationContent({
        context: mockContext,
        metadata: {
          ...mockMetadata,
          validationErrors: {
            amountPerPeriodError: 'Invalid amount',
            initialAmountError: 'Invalid initial amount',
          },
        },
        isJustificationCollapsed: true,
        showAddMoreRulesButton: false,
        origin: 'https://example.com',
        chainId: 1,
      });

      expect(contentWithErrors).toMatchInlineSnapshot(`
{
  "key": null,
  "props": {
    "children": {
      "key": null,
      "props": {
        "children": [
          {
            "key": null,
            "props": {
              "center": true,
              "children": {
                "key": null,
                "props": {
                  "children": "Native token stream",
                  "size": "lg",
                },
                "type": "Heading",
              },
            },
            "type": "Box",
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
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Recipient",
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
                                      "children": "The site requesting the permission",
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
                            "children": [
                              null,
                              {
                                "key": null,
                                "props": {
                                  "children": "https://example.com",
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
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Network",
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
                                      "children": "The network on which the permission is being requested",
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
                            "children": [
                              null,
                              {
                                "key": null,
                                "props": {
                                  "children": "Ethereum",
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
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Token",
                                },
                                "type": "Text",
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
                                  "alt": "ETH",
                                  "src": "<svg width="16" height="16" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<circle cx="16" cy="16" r="16" fill="#F2F4F6"/>
<circle cx="16" cy="16" r="15.5" stroke="#B7BBC8" stroke-opacity="0.4"/>
<g clip-path="url(#clip0_373_6813)">
<rect width="32" height="32" fill="url(#pattern0_373_6813)"/>
</g>
<defs>
<pattern id="pattern0_373_6813" patternContentUnits="objectBoundingBox" width="1" height="1">
<use xlink:href="#image0_373_6813" transform="scale(0.0166667)"/>
</pattern>
<clipPath id="clip0_373_6813">
<rect width="32" height="32" rx="16" fill="white"/>
</clipPath>
<image id="image0_373_6813" width="60" height="60" preserveAspectRatio="none" xlink:href="data:image/png;base64,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"/>
</defs>
</svg>
",
                                },
                                "type": "Image",
                              },
                              {
                                "key": null,
                                "props": {
                                  "children": "ETH",
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
                    "alignment": "space-between",
                    "children": [
                      {
                        "key": null,
                        "props": {
                          "children": [
                            {
                              "key": null,
                              "props": {
                                "children": "Reason",
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
                                    "children": "Reason given by the recipient for requesting this token stream allowance.",
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
                          "children": {
                            "key": null,
                            "props": {
                              "children": [
                                {
                                  "key": null,
                                  "props": {
                                    "children": "Permission to str...",
                                    "color": "muted",
                                  },
                                  "type": "Text",
                                },
                                {
                                  "key": null,
                                  "props": {
                                    "alignment": "end",
                                    "children": {
                                      "key": null,
                                      "props": {
                                        "children": "Show",
                                        "name": "justification-show-more",
                                      },
                                      "type": "Button",
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
            },
            "type": "Section",
          },
          {
            "key": null,
            "props": {
              "children": {
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
                                    "children": "Stream from",
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
                                        "children": "The account that the token stream comes from.",
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
                              "children": [
                                {
                                  "key": null,
                                  "props": {
                                    "address": "eip155:1:0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                                    "size": "sm",
                                  },
                                  "type": "Avatar",
                                },
                                {
                                  "key": null,
                                  "props": {
                                    "children": "Gator Account",
                                    "color": "default",
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
                        "alignment": "end",
                        "children": [
                          {
                            "key": null,
                            "props": {
                              "children": "$🐊10.00",
                              "color": "muted",
                            },
                            "type": "Text",
                          },
                          {
                            "key": null,
                            "props": {
                              "children": [
                                "10",
                                " available",
                              ],
                              "color": "alternative",
                            },
                            "type": "Text",
                          },
                        ],
                        "direction": "horizontal",
                      },
                      "type": "Box",
                    },
                  ],
                  "direction": "vertical",
                },
                "type": "Box",
              },
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
                            "name": "native-token-stream-amount-per-period",
                            "type": "number",
                            "value": "302400",
                          },
                          "type": "Input",
                        },
                        {
                          "key": null,
                          "props": {
                            "children": "Invalid amount",
                            "color": "error",
                          },
                          "type": "Text",
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
                            "children": {
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
                            "direction": "horizontal",
                          },
                          "type": "Box",
                        },
                        {
                          "key": null,
                          "props": {
                            "children": [
                              {
                                "key": "Daily",
                                "props": {
                                  "children": "Daily",
                                  "value": "Daily",
                                },
                                "type": "Option",
                              },
                              {
                                "key": "Weekly",
                                "props": {
                                  "children": "Weekly",
                                  "value": "Weekly",
                                },
                                "type": "Option",
                              },
                              {
                                "key": "Monthly",
                                "props": {
                                  "children": "Monthly",
                                  "value": "Monthly",
                                },
                                "type": "Option",
                              },
                            ],
                            "name": "native-token-stream-time-period",
                            "value": "Weekly",
                          },
                          "type": "Dropdown",
                        },
                        null,
                      ],
                      "direction": "vertical",
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
                          "disabled": true,
                          "name": "stream-rate",
                          "type": "text",
                          "value": "0.5 ETH/sec",
                        },
                        "type": "Input",
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
          {
            "key": null,
            "props": {
              "children": [
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
                            {
                              "key": null,
                              "props": {
                                "children": "Remove",
                                "name": "native-token-stream-initial-amount_removeButton",
                                "type": "button",
                              },
                              "type": "Button",
                            },
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                      {
                        "key": null,
                        "props": {
                          "name": "native-token-stream-initial-amount",
                          "type": "number",
                          "value": "1",
                        },
                        "type": "Input",
                      },
                      {
                        "key": null,
                        "props": {
                          "children": "Invalid initial amount",
                          "color": "error",
                        },
                        "type": "Text",
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
                            {
                              "key": null,
                              "props": {
                                "children": "Remove",
                                "name": "native-token-stream-max-amount_removeButton",
                                "type": "button",
                              },
                              "type": "Button",
                            },
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                      {
                        "key": null,
                        "props": {
                          "name": "native-token-stream-max-amount",
                          "type": "number",
                          "value": "10",
                        },
                        "type": "Input",
                      },
                      null,
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
                                          "children": "The start time of the stream.",
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
                          "name": "native-token-stream-start-time",
                          "type": "text",
                          "value": "10/26/1985",
                        },
                        "type": "Input",
                      },
                      null,
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
                                          "children": "The expiry date of the stream.",
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
                          "name": "native-token-stream-expiry",
                          "type": "text",
                          "value": "05/01/2024",
                        },
                        "type": "Input",
                      },
                      null,
                    ],
                    "direction": "vertical",
                  },
                  "type": "Box",
                },
              ],
            },
            "type": "Section",
          },
          null,
        ],
        "direction": "vertical",
      },
      "type": "Box",
    },
  },
  "type": "Box",
}
`);
    });

    it('should handle disabled fields when adjustment is not allowed', () => {
      const contentWithoutAdjustment = createConfirmationContent({
        context: {
          ...mockContext,
          isAdjustmentAllowed: false,
        },
        metadata: mockMetadata,
        isJustificationCollapsed: true,
        showAddMoreRulesButton: false,
        origin: 'https://example.com',
        chainId: 1,
      });

      expect(contentWithoutAdjustment).toMatchInlineSnapshot(`
{
  "key": null,
  "props": {
    "children": {
      "key": null,
      "props": {
        "children": [
          {
            "key": null,
            "props": {
              "center": true,
              "children": {
                "key": null,
                "props": {
                  "children": "Native token stream",
                  "size": "lg",
                },
                "type": "Heading",
              },
            },
            "type": "Box",
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
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Recipient",
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
                                      "children": "The site requesting the permission",
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
                            "children": [
                              null,
                              {
                                "key": null,
                                "props": {
                                  "children": "https://example.com",
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
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Network",
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
                                      "children": "The network on which the permission is being requested",
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
                            "children": [
                              null,
                              {
                                "key": null,
                                "props": {
                                  "children": "Ethereum",
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
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Token",
                                },
                                "type": "Text",
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
                                  "alt": "ETH",
                                  "src": "<svg width="16" height="16" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<circle cx="16" cy="16" r="16" fill="#F2F4F6"/>
<circle cx="16" cy="16" r="15.5" stroke="#B7BBC8" stroke-opacity="0.4"/>
<g clip-path="url(#clip0_373_6813)">
<rect width="32" height="32" fill="url(#pattern0_373_6813)"/>
</g>
<defs>
<pattern id="pattern0_373_6813" patternContentUnits="objectBoundingBox" width="1" height="1">
<use xlink:href="#image0_373_6813" transform="scale(0.0166667)"/>
</pattern>
<clipPath id="clip0_373_6813">
<rect width="32" height="32" rx="16" fill="white"/>
</clipPath>
<image id="image0_373_6813" width="60" height="60" preserveAspectRatio="none" xlink:href="data:image/png;base64,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"/>
</defs>
</svg>
",
                                },
                                "type": "Image",
                              },
                              {
                                "key": null,
                                "props": {
                                  "children": "ETH",
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
                    "alignment": "space-between",
                    "children": [
                      {
                        "key": null,
                        "props": {
                          "children": [
                            {
                              "key": null,
                              "props": {
                                "children": "Reason",
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
                                    "children": "Reason given by the recipient for requesting this token stream allowance.",
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
                          "children": {
                            "key": null,
                            "props": {
                              "children": [
                                {
                                  "key": null,
                                  "props": {
                                    "children": "Permission to str...",
                                    "color": "muted",
                                  },
                                  "type": "Text",
                                },
                                {
                                  "key": null,
                                  "props": {
                                    "alignment": "end",
                                    "children": {
                                      "key": null,
                                      "props": {
                                        "children": "Show",
                                        "name": "justification-show-more",
                                      },
                                      "type": "Button",
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
            },
            "type": "Section",
          },
          {
            "key": null,
            "props": {
              "children": {
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
                                    "children": "Stream from",
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
                                        "children": "The account that the token stream comes from.",
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
                              "children": [
                                {
                                  "key": null,
                                  "props": {
                                    "address": "eip155:1:0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                                    "size": "sm",
                                  },
                                  "type": "Avatar",
                                },
                                {
                                  "key": null,
                                  "props": {
                                    "children": "Gator Account",
                                    "color": "default",
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
                        "alignment": "end",
                        "children": [
                          {
                            "key": null,
                            "props": {
                              "children": "$🐊10.00",
                              "color": "muted",
                            },
                            "type": "Text",
                          },
                          {
                            "key": null,
                            "props": {
                              "children": [
                                "10",
                                " available",
                              ],
                              "color": "alternative",
                            },
                            "type": "Text",
                          },
                        ],
                        "direction": "horizontal",
                      },
                      "type": "Box",
                    },
                  ],
                  "direction": "vertical",
                },
                "type": "Box",
              },
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
                        {
                          "key": null,
                          "props": {
                            "children": {
                              "key": null,
                              "props": {
                                "children": "302400",
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
                        {
                          "key": null,
                          "props": {
                            "children": {
                              "key": null,
                              "props": {
                                "children": "Weekly",
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
                          "disabled": true,
                          "name": "stream-rate",
                          "type": "text",
                          "value": "0.5 ETH/sec",
                        },
                        "type": "Input",
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
                      {
                        "key": null,
                        "props": {
                          "children": {
                            "key": null,
                            "props": {
                              "children": "1",
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
                      {
                        "key": null,
                        "props": {
                          "children": {
                            "key": null,
                            "props": {
                              "children": "10",
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
                                    "children": "The start time of the stream.",
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
                          "children": {
                            "key": null,
                            "props": {
                              "children": "10/26/1985",
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
                                    "children": "The expiry date of the stream.",
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
                          "children": {
                            "key": null,
                            "props": {
                              "children": "05/01/2024",
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
              ],
            },
            "type": "Section",
          },
          null,
        ],
        "direction": "vertical",
      },
      "type": "Box",
    },
  },
  "type": "Box",
}
`);
    });

    it('should handle missing optional fields', () => {
      const contentWithMissingFields = createConfirmationContent({
        context: {
          ...mockContext,
          permissionDetails: {
            ...mockContext.permissionDetails,
            initialAmount: undefined,
            maxAmount: undefined,
          },
        },
        metadata: {
          ...mockMetadata,
          rulesToAdd: ['Initial amount', 'Max amount'],
        },
        isJustificationCollapsed: true,
        showAddMoreRulesButton: false,
        origin: 'https://example.com',
        chainId: 1,
      });

      expect(contentWithMissingFields).toMatchInlineSnapshot(`
{
  "key": null,
  "props": {
    "children": {
      "key": null,
      "props": {
        "children": [
          {
            "key": null,
            "props": {
              "center": true,
              "children": {
                "key": null,
                "props": {
                  "children": "Native token stream",
                  "size": "lg",
                },
                "type": "Heading",
              },
            },
            "type": "Box",
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
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Recipient",
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
                                      "children": "The site requesting the permission",
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
                            "children": [
                              null,
                              {
                                "key": null,
                                "props": {
                                  "children": "https://example.com",
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
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Network",
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
                                      "children": "The network on which the permission is being requested",
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
                            "children": [
                              null,
                              {
                                "key": null,
                                "props": {
                                  "children": "Ethereum",
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
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Token",
                                },
                                "type": "Text",
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
                                  "alt": "ETH",
                                  "src": "<svg width="16" height="16" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<circle cx="16" cy="16" r="16" fill="#F2F4F6"/>
<circle cx="16" cy="16" r="15.5" stroke="#B7BBC8" stroke-opacity="0.4"/>
<g clip-path="url(#clip0_373_6813)">
<rect width="32" height="32" fill="url(#pattern0_373_6813)"/>
</g>
<defs>
<pattern id="pattern0_373_6813" patternContentUnits="objectBoundingBox" width="1" height="1">
<use xlink:href="#image0_373_6813" transform="scale(0.0166667)"/>
</pattern>
<clipPath id="clip0_373_6813">
<rect width="32" height="32" rx="16" fill="white"/>
</clipPath>
<image id="image0_373_6813" width="60" height="60" preserveAspectRatio="none" xlink:href="data:image/png;base64,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"/>
</defs>
</svg>
",
                                },
                                "type": "Image",
                              },
                              {
                                "key": null,
                                "props": {
                                  "children": "ETH",
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
                    "alignment": "space-between",
                    "children": [
                      {
                        "key": null,
                        "props": {
                          "children": [
                            {
                              "key": null,
                              "props": {
                                "children": "Reason",
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
                                    "children": "Reason given by the recipient for requesting this token stream allowance.",
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
                          "children": {
                            "key": null,
                            "props": {
                              "children": [
                                {
                                  "key": null,
                                  "props": {
                                    "children": "Permission to str...",
                                    "color": "muted",
                                  },
                                  "type": "Text",
                                },
                                {
                                  "key": null,
                                  "props": {
                                    "alignment": "end",
                                    "children": {
                                      "key": null,
                                      "props": {
                                        "children": "Show",
                                        "name": "justification-show-more",
                                      },
                                      "type": "Button",
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
            },
            "type": "Section",
          },
          {
            "key": null,
            "props": {
              "children": {
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
                                    "children": "Stream from",
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
                                        "children": "The account that the token stream comes from.",
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
                              "children": [
                                {
                                  "key": null,
                                  "props": {
                                    "address": "eip155:1:0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                                    "size": "sm",
                                  },
                                  "type": "Avatar",
                                },
                                {
                                  "key": null,
                                  "props": {
                                    "children": "Gator Account",
                                    "color": "default",
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
                        "alignment": "end",
                        "children": [
                          {
                            "key": null,
                            "props": {
                              "children": "$🐊10.00",
                              "color": "muted",
                            },
                            "type": "Text",
                          },
                          {
                            "key": null,
                            "props": {
                              "children": [
                                "10",
                                " available",
                              ],
                              "color": "alternative",
                            },
                            "type": "Text",
                          },
                        ],
                        "direction": "horizontal",
                      },
                      "type": "Box",
                    },
                  ],
                  "direction": "vertical",
                },
                "type": "Box",
              },
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
                            "name": "native-token-stream-amount-per-period",
                            "type": "number",
                            "value": "302400",
                          },
                          "type": "Input",
                        },
                        null,
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
                            "children": {
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
                            "direction": "horizontal",
                          },
                          "type": "Box",
                        },
                        {
                          "key": null,
                          "props": {
                            "children": [
                              {
                                "key": "Daily",
                                "props": {
                                  "children": "Daily",
                                  "value": "Daily",
                                },
                                "type": "Option",
                              },
                              {
                                "key": "Weekly",
                                "props": {
                                  "children": "Weekly",
                                  "value": "Weekly",
                                },
                                "type": "Option",
                              },
                              {
                                "key": "Monthly",
                                "props": {
                                  "children": "Monthly",
                                  "value": "Monthly",
                                },
                                "type": "Option",
                              },
                            ],
                            "name": "native-token-stream-time-period",
                            "value": "Weekly",
                          },
                          "type": "Dropdown",
                        },
                        null,
                      ],
                      "direction": "vertical",
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
                          "disabled": true,
                          "name": "stream-rate",
                          "type": "text",
                          "value": "0.5 ETH/sec",
                        },
                        "type": "Input",
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
          {
            "key": null,
            "props": {
              "children": [
                null,
                null,
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
                                          "children": "The start time of the stream.",
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
                          "name": "native-token-stream-start-time",
                          "type": "text",
                          "value": "10/26/1985",
                        },
                        "type": "Input",
                      },
                      null,
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
                                          "children": "The expiry date of the stream.",
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
                          "name": "native-token-stream-expiry",
                          "type": "text",
                          "value": "05/01/2024",
                        },
                        "type": "Input",
                      },
                      null,
                    ],
                    "direction": "vertical",
                  },
                  "type": "Box",
                },
              ],
            },
            "type": "Section",
          },
          null,
        ],
        "direction": "vertical",
      },
      "type": "Box",
    },
  },
  "type": "Box",
}
`);
    });

    it('should handle different time periods', () => {
      const contentWithDailyPeriod = createConfirmationContent({
        context: {
          ...mockContext,
          permissionDetails: {
            ...mockContext.permissionDetails,
            timePeriod: TimePeriod.DAILY,
          },
        },
        metadata: {
          ...mockMetadata,
          rulesToAdd: ['Initial amount', 'Max amount'],
        },
        isJustificationCollapsed: true,
        showAddMoreRulesButton: false,
        origin: 'https://example.com',
        chainId: 1,
      });

      expect(contentWithDailyPeriod).toMatchInlineSnapshot(`
{
  "key": null,
  "props": {
    "children": {
      "key": null,
      "props": {
        "children": [
          {
            "key": null,
            "props": {
              "center": true,
              "children": {
                "key": null,
                "props": {
                  "children": "Native token stream",
                  "size": "lg",
                },
                "type": "Heading",
              },
            },
            "type": "Box",
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
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Recipient",
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
                                      "children": "The site requesting the permission",
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
                            "children": [
                              null,
                              {
                                "key": null,
                                "props": {
                                  "children": "https://example.com",
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
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Network",
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
                                      "children": "The network on which the permission is being requested",
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
                            "children": [
                              null,
                              {
                                "key": null,
                                "props": {
                                  "children": "Ethereum",
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
                            "children": [
                              {
                                "key": null,
                                "props": {
                                  "children": "Token",
                                },
                                "type": "Text",
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
                                  "alt": "ETH",
                                  "src": "<svg width="16" height="16" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<circle cx="16" cy="16" r="16" fill="#F2F4F6"/>
<circle cx="16" cy="16" r="15.5" stroke="#B7BBC8" stroke-opacity="0.4"/>
<g clip-path="url(#clip0_373_6813)">
<rect width="32" height="32" fill="url(#pattern0_373_6813)"/>
</g>
<defs>
<pattern id="pattern0_373_6813" patternContentUnits="objectBoundingBox" width="1" height="1">
<use xlink:href="#image0_373_6813" transform="scale(0.0166667)"/>
</pattern>
<clipPath id="clip0_373_6813">
<rect width="32" height="32" rx="16" fill="white"/>
</clipPath>
<image id="image0_373_6813" width="60" height="60" preserveAspectRatio="none" xlink:href="data:image/png;base64,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"/>
</defs>
</svg>
",
                                },
                                "type": "Image",
                              },
                              {
                                "key": null,
                                "props": {
                                  "children": "ETH",
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
                    "alignment": "space-between",
                    "children": [
                      {
                        "key": null,
                        "props": {
                          "children": [
                            {
                              "key": null,
                              "props": {
                                "children": "Reason",
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
                                    "children": "Reason given by the recipient for requesting this token stream allowance.",
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
                          "children": {
                            "key": null,
                            "props": {
                              "children": [
                                {
                                  "key": null,
                                  "props": {
                                    "children": "Permission to str...",
                                    "color": "muted",
                                  },
                                  "type": "Text",
                                },
                                {
                                  "key": null,
                                  "props": {
                                    "alignment": "end",
                                    "children": {
                                      "key": null,
                                      "props": {
                                        "children": "Show",
                                        "name": "justification-show-more",
                                      },
                                      "type": "Button",
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
            },
            "type": "Section",
          },
          {
            "key": null,
            "props": {
              "children": {
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
                                    "children": "Stream from",
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
                                        "children": "The account that the token stream comes from.",
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
                              "children": [
                                {
                                  "key": null,
                                  "props": {
                                    "address": "eip155:1:0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                                    "size": "sm",
                                  },
                                  "type": "Avatar",
                                },
                                {
                                  "key": null,
                                  "props": {
                                    "children": "Gator Account",
                                    "color": "default",
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
                        "alignment": "end",
                        "children": [
                          {
                            "key": null,
                            "props": {
                              "children": "$🐊10.00",
                              "color": "muted",
                            },
                            "type": "Text",
                          },
                          {
                            "key": null,
                            "props": {
                              "children": [
                                "10",
                                " available",
                              ],
                              "color": "alternative",
                            },
                            "type": "Text",
                          },
                        ],
                        "direction": "horizontal",
                      },
                      "type": "Box",
                    },
                  ],
                  "direction": "vertical",
                },
                "type": "Box",
              },
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
                            "name": "native-token-stream-amount-per-period",
                            "type": "number",
                            "value": "302400",
                          },
                          "type": "Input",
                        },
                        null,
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
                            "children": {
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
                            "direction": "horizontal",
                          },
                          "type": "Box",
                        },
                        {
                          "key": null,
                          "props": {
                            "children": [
                              {
                                "key": "Daily",
                                "props": {
                                  "children": "Daily",
                                  "value": "Daily",
                                },
                                "type": "Option",
                              },
                              {
                                "key": "Weekly",
                                "props": {
                                  "children": "Weekly",
                                  "value": "Weekly",
                                },
                                "type": "Option",
                              },
                              {
                                "key": "Monthly",
                                "props": {
                                  "children": "Monthly",
                                  "value": "Monthly",
                                },
                                "type": "Option",
                              },
                            ],
                            "name": "native-token-stream-time-period",
                            "value": "Daily",
                          },
                          "type": "Dropdown",
                        },
                        null,
                      ],
                      "direction": "vertical",
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
                          "disabled": true,
                          "name": "stream-rate",
                          "type": "text",
                          "value": "0.5 ETH/sec",
                        },
                        "type": "Input",
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
          {
            "key": null,
            "props": {
              "children": [
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
                            {
                              "key": null,
                              "props": {
                                "children": "Remove",
                                "name": "native-token-stream-initial-amount_removeButton",
                                "type": "button",
                              },
                              "type": "Button",
                            },
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                      {
                        "key": null,
                        "props": {
                          "name": "native-token-stream-initial-amount",
                          "type": "number",
                          "value": "1",
                        },
                        "type": "Input",
                      },
                      null,
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
                            {
                              "key": null,
                              "props": {
                                "children": "Remove",
                                "name": "native-token-stream-max-amount_removeButton",
                                "type": "button",
                              },
                              "type": "Button",
                            },
                          ],
                          "direction": "horizontal",
                        },
                        "type": "Box",
                      },
                      {
                        "key": null,
                        "props": {
                          "name": "native-token-stream-max-amount",
                          "type": "number",
                          "value": "10",
                        },
                        "type": "Input",
                      },
                      null,
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
                                          "children": "The start time of the stream.",
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
                          "name": "native-token-stream-start-time",
                          "type": "text",
                          "value": "10/26/1985",
                        },
                        "type": "Input",
                      },
                      null,
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
                                          "children": "The expiry date of the stream.",
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
                          "name": "native-token-stream-expiry",
                          "type": "text",
                          "value": "05/01/2024",
                        },
                        "type": "Input",
                      },
                      null,
                    ],
                    "direction": "vertical",
                  },
                  "type": "Box",
                },
              ],
            },
            "type": "Section",
          },
          null,
        ],
        "direction": "vertical",
      },
      "type": "Box",
    },
  },
  "type": "Box",
}
`);
    });
  });
});
