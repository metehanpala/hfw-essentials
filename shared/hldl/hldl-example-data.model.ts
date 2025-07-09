/* eslint-disable*/
const SNAPIN_TITLE = 'SNAPIN-TITLE';
const EVENT_LIST = 'event-list';
const SYSTEM_MANAGER = 'system-manager';
const VID_VIEW_COMPARISION = 'vid-view-comparison';
// const TREND_COMPARISON = 'trend-comparison';
// const SCHEDULE_COMPARISON = 'schedule-comparison';
// const DOCUMENT_COMPARISON = 'document-comparison';
// const GRAPH_COMPARISON = 'graph-comparison';
const SYSTEM_MNGT = 'system-manager.selection-pane';
// const TXT_VIEW_COMPARISON = 'txt-view-comparison';
// const GRAPH_SINGLE = 'graph-single';
const NEW_PRIMARY_SELECTION = 'new-primary-selection';
// const SELECTION_PANE = 'selection-pane';
const PRIMARY_PANE = 'primary-pane';
const COMPARISON_PANE = 'comparison-pane';
// const EVENT_LIST_SINGLE_PANE = 'event-list.single-pane';
// const SINGLE_PANE = 'single-pane';
const ELEMENT_LAYOUT_PANE_1 = 'element-layout-pane-1';
// const ED_PANE_SPLITTER = 'ed-pane-splitter';
// const ONLY_SCREEN_AND_XPX = 'only screen and (min-width:640px)';
// const SELECTION_PANE_SPLITTER = 'selection-pane-splitter';
// const PRIMARY_PANE_HORIZONTAL_SPLITTER = 'primary-pane-horizontal-splitter';
// const RELATED_PANE_SPLITTER = 'related-pane-splitter';
// const COMPARISON_PANE_SPLITTER = 'comparison-pane-splitter';
// const ELEMENT_LAYOUT_PANE_5 = 'element-layout-pane-5';
// const SM_PRIMARY_PANE = 'system-manager.primary-pane';
// const SM_SINGLE_PANE = 'system-manager.single-pane';
const SM_COMPARISON_PANE = 'system-manager.comparison-pane';

export const HLDL_TEST_EXAMPLE: any =
  {
    'hfwInstance': {
      'snapInTypes': [
        {
          'typeId': 'SystemBrowserType',
          'resourceFolder': '@gms/system-browser/i18n/'
        },
        {
          'typeId': 'RelatedItemType',
          'resourceFolder': '@gms/related-items/i18n/',
          'config': {
            'exceptions': [
              {
                'managedTypeName': 'NewReport',
                'new': true,
                'hide': true
              },
              {
                'managedTypeName': 'NewTrend',
                'new': true,
                'hide': false
              },
              {
                'managedTypeName': 'NewRemoteNotification',
                'new': true,
                'hide': true
              },
              {
                'managedTypeName': 'BACnet Command Table',
                'new': false,
                'hide': true
              },
              {
                'managedTypeName': 'OperatorTasksTemplate',
                'new': false,
                'hide': true
              },
              {
                'managedTypeName': 'ReportDefinition',
                'new': false,
                'hide': true
              }
            ],
            'framesHostingOnRightPanel': [
              'system-manager'
            ]
          }
        },
        {
          'typeId': 'GraphicsViewerType',
          'resourceFolder': '@gms/graphics-viewer/i18n/',
          'config': {
            'EnableAlarmIndication': true,
            'AlarmIconSize': 16,
            'EnableDownwardNavigation': false
          }
        },
        {
          'typeId': 'TextualViewerType',
          'resourceFolder': '@gms/textual-viewer/i18n/'
        },
        {
          'typeId': 'DocumentViewerType',
          'resourceFolder': '@gms/document/i18n/',
          'messageTypes': [
            {
              'name': 'External Document'
            },
            {
              'name': 'File Viewer'
            }
          ]
        },
        {
          'typeId': 'ReportViewerSnapInType',
          'resourceFolder': '@gms/report-viewer/i18n/',
          'messageTypes': [
            {
              'name': 'Reports'
            },
            {
              'name': 'ReportContentProvider'
            },
            {
              'name': 'ReportDocumentProvider'
            },
            {
              'name': 'NewReport'
            },
            {
              'name': 'ReportDefinition'
            },
            {
              'name': 'ReportFolder'
            },
            {
              'name': 'Report Manager'
            }
          ]
        },
        {
          'typeId': 'PropertyViewerType',
          'resourceFolder': '@gms/property/i18n/'
        },
        {
          'typeId': 'SummaryBarType',
          'resourceFolder': '@gms/summary-bar/i18n/'
        },
        {
          'typeId': 'EventListType',
          'resourceFolder': '@gms/event-list/i18n/'
        },
        {
          'typeId': 'EventDetailsType',
          'resourceFolder': '@gms/event-details/i18n/'
        },
        {
          'typeId': 'TrendSnapInType',
          'resourceFolder': '@gms/trend/i18n/',
          'config': {
            'collectPropertyNameSubsystem': [
              {
                'TrendLog': [
                  {
                    'property': 'Log_Enable',
                    'command': 'Collect'
                  },
                  {
                    'property': 'Enable',
                    'command': 'CollectTrend'
                  },
                  {
                    'property': 'Dpx_Enable_Log',
                    'command': 'CollectTrend'
                  }
                ]
              },
              {
                'TrendLogSORIS': [
                  {
                    'property': 'Object_Name',
                    'command': 'Collect'
                  }
                ]
              },
              {
                'TrendLogApogee': [
                  {
                    'property': 'Samples',
                    'command': 'CollectSample'
                  }
                ]
              },
              {
                'P2': [
                  {
                    'property': 'Enabled_P2',
                    'command': ''
                  }
                ]
              }
            ]
          },
          'messageTypes': [
            {
              'name': 'TrendLog'
            },
            {
              'name': 'TrendLogOnline'
            },
            {
              'name': 'TrendsFolder'
            },
            {
              'name': 'TrendLogPredicted'
            },
            {
              'name': 'TrendViewDefinition'
            },
            {
              'name': 'NewTrend'
            },
            {
              'name': 'TrendLogSORIS'
            },
            {
              'name': 'TrendLogS7'
            }
          ]
        },
        {
          'typeId': 'LogViewerSnapInType',
          'resourceFolder': '@gms/log-viewer/i18n/',
          'messageTypes': [
            {
              'name': 'LogViewer'
            },
            {
              'name': 'LogViewFolder'
            },
            {
              'name': 'LogViewDefinition'
            }
          ]
        },
        {
          'typeId': 'AboutSnapinType',
          'resourceFolder': '@gms/about/i18n/'
        },
        {
          'typeId': 'AccountSnapinType',
          'resourceFolder': '@gms/account/i18n/'
        },
        {
          'typeId': 'NotifConfigSnapinType',
          'resourceFolder': '@gms/notifconfig/i18n/'
        },
        {
          'typeId': 'ScheduleSnapInType',
          'resourceFolder': '@gms/schedule/i18n/',
          'messageTypes': [
            {
              'name': 'BACnet Schedule'
            },
            {
              'name': 'BACnet Calendar Folder'
            },
            {
              'name': 'BACnet Schedule Folder'
            },
            {
              'name': 'Schedule Folder'
            },
            {
              'name': 'BACnet Calendar'
            },
            {
              'name': 'Workstation Schedule Folder'
            },
            {
              'name': 'Workstation Calendar Folder'
            }
          ]
        }
      ],
      'hfwFrames': [
        {
          'snapInInstances': [
            {
              'snapInId': 'sb',
              'typeId': 'SummaryBarType'
            }
          ],
          'panes': [
            {
              'snapInReferences': [
                {
                  'id': 'sb',
                  'config': {
                    'EnableNotificationsForNewEvents': true,
                    'EnableCollapsing': true,
                    'IsCollapsed': true,
                    'CanMuteSoundFor': 'EntireSession',
                    'AudioAlertForAckedEvents': false
                  }
                }
              ],
              'id': 'sb-pane'
            }
          ],
          'id': 'summary-bar',
          'docked': 'top'
        },
        {
          'snapInInstances': [
            {
              'snapInId': 'about',
              'typeId': 'AboutSnapinType'
            }
          ],
          'panes': [
            {
              'snapInReferences': [
                {
                  'id': 'about'
                }
              ],
              'id': 'about-pane'
            }
          ],
          'id': 'about-frame-id',
          'docked': 'none'
        },
        {
          'snapInInstances': [
            {
              'snapInId': 'account',
              'typeId': 'AccountSnapinType'
            }
          ],
          'panes': [
            {
              'snapInReferences': [
                {
                  'id': 'account'
                }
              ],
              'id': 'account-pane'
            }
          ],
          'id': 'account-frame-id',
          'docked': 'none'
        },
        {
          'snapInInstances': [
            {
              'snapInId': 'notifconfig',
              'typeId': 'NotifConfigSnapinType'
            }
          ],
          'panes': [
            {
              'snapInReferences': [
                {
                  'id': 'notifconfig',
                  'config': {
                    'CanEditSoundSettings': true
                  }
                }
              ],
              'id': 'notifconfig-pane'
            }
          ],
          'id': 'notifconfig-frame-id',
          'docked': 'none'
        },
        {
          'snapInInstances': [
            {
              'snapInId': 'el',
              'typeId': 'EventListType',
              'tabTitleId': 'SNAPIN-TITLE'
            },
            {
              'snapInId': 'ed',
              'typeId': 'EventDetailsType',
              'tabTitleId': 'SNAPIN-TITLE'
            },
            {
              'snapInId': 'prp-view-ed',
              'typeId': 'PropertyViewerType',
              'tabTitleId': 'SNAPIN-TITLE'
            }
          ],
          'panes': [
            {
              'snapInReferences': [
                {
                  'id': 'el',
                  'communicationRules': [
                    {
                      'destination': 'event-list.ed-pane'
                    }
                  ],
                  'config': {
                    'autoRemoveFilterOnNewEvents': false,
                    'disableGroupEvents': false,
                    'columns': [
                      {
                        'name': 'eventIcon'
                      },
                      {
                        'name': 'cause'
                      },
                      {
                        'name': 'state'
                      },
                      {
                        'name': 'creationTime'
                      },
                      {
                        'name': 'srcSource'
                      },
                      {
                        'name': 'belongsTo'
                      }
                    ],
                    'sorting_criteria': [
                      {
                        'column_name': 'state',
                        'direction': 'Ascending'
                      },
                      {
                        'column_name': 'categoryDescriptor',
                        'direction': 'Ascending'
                      },
                      {
                        'column_name': 'creationTime',
                        'direction': 'Descending'
                      }
                    ]
                  }
                }
              ],
              'id': 'el-pane',
              'titleVisible': true,
              'paneTitleOrSnapinTitle': 'snapin',
              'primaryHeader': false,
              'hasTab': false
            },
            {
              'snapInReferences': [
                {
                  'id': 'ed',
                  'communicationRules': [
                    {
                      'destination': 'system-manager.selection-pane',
                      'ruleName': 'new-primary-selection'
                    },
                    {
                      'destination': 'event-list.el-pane'
                    }
                  ]
                },
                {
                  'id': 'prp-view-ed'
                }
              ],
              'id': 'ed-pane',
              'titleVisible': false,
              'primaryHeader': false,
              'hasTab': true,
              'displaySelectedObject': false
            }
          ],
          'layoutInstances': [
            {
              'paneInstance': {
                'id': 'el-pane'
              },
              'id': '1-pane',
              'iconClass': 'element-layout-pane-1',
              'mediaQuery': 'only screen and (min-width:360px)'
            },
            {
              'splitter': {
                'id': 'ed-pane-splitter',
                'firstChild': {
                  'paneInstance': {
                    'id': 'el-pane'
                  }
                },
                'secondChild': {
                  'paneInstance': {
                    'id': 'ed-pane'
                  }
                },
                'orientation': 'vertical',
                'secondChildSize': '340px',
                'collapsingPane': 'second'
              },
              'id': '2-pane',
              'isDefault': true,
              'iconClass': 'element-layout-pane-2-right',
              'mediaQuery': 'only screen and (min-width:360px)'
            }
          ],
          'qParamServices': [
            {
              'id': 'EventQParamService',
              'primaryChannelId': 'primary',
              'channels': [
                {
                  'id': 'primary',
                  'communicationRules': [
                    {
                      'destination': 'event-list.ed-pane'
                    }
                  ]
                }
              ]
            }
          ],
          'id': 'event-list',
          'iconClass': 'element-alarm-filled'
        },
        {
          'snapInInstances': [
            {
              'snapInId': 'sys-brow',
              'typeId': 'SystemBrowserType',
              'tabTitleId': 'SNAPIN-TITLE'
            },
            {
              'snapInId': 'trend',
              'canLoseFocusOnPreselection': true,
              'typeId': 'TrendSnapInType',
              'tabTitleId': 'SNAPIN-TITLE'
            },
            {
              'snapInId': 'log-viewer',
              'canLoseFocusOnPreselection': true,
              'typeId': 'LogViewerSnapInType',
              'tabTitleId': 'SNAPIN-TITLE'
            },
            {
              'snapInId': 'schedule',
              'canLoseFocusOnPreselection': true,
              'typeId': 'ScheduleSnapInType',
              'tabTitleId': 'SNAPIN-TITLE'
            },
            {
              'snapInId': 'document',
              'canLoseFocusOnPreselection': true,
              'typeId': 'DocumentViewerType',
              'tabTitleId': 'SNAPIN-TITLE'
            },
            {
              'snapInId': 'graph',
              'canLoseFocusOnPreselection': true,
              'typeId': 'GraphicsViewerType',
              'tabTitleId': 'SNAPIN-TITLE'
            },
            {
              'snapInId': 'txt-view',
              'canLoseFocusOnPreselection': true,
              'typeId': 'TextualViewerType',
              'tabTitleId': 'SNAPIN-TITLE'
            },
            {
              'snapInId': 'report-view',
              'canLoseFocusOnPreselection': true,
              'typeId': 'ReportViewerSnapInType',
              'tabTitleId': 'SNAPIN-TITLE'
            },
            {
              'snapInId': 'prp-view',
              'canLoseFocusOnPreselection': true,
              'typeId': 'PropertyViewerType',
              'tabTitleId': 'SNAPIN-TITLE'
            },
            {
              'snapInId': 'related',
              'canLoseFocusOnPreselection': true,
              'typeId': 'RelatedItemType',
              'tabTitleId': 'SNAPIN-TITLE'
            },
            {
              'snapInId': 'trend-comparison',
              'canLoseFocusOnPreselection': true,
              'typeId': 'TrendSnapInType',
              'tabTitleId': 'SNAPIN-TITLE'
            },
            {
              'snapInId': 'schedule-comparison',
              'canLoseFocusOnPreselection': true,
              'typeId': 'ScheduleSnapInType',
              'tabTitleId': 'SNAPIN-TITLE'
            },
            {
              'snapInId': 'document-comparison',
              'canLoseFocusOnPreselection': true,
              'typeId': 'DocumentViewerType',
              'tabTitleId': 'SNAPIN-TITLE'
            },
            {
              'snapInId': 'graph-comparison',
              'canLoseFocusOnPreselection': true,
              'typeId': 'GraphicsViewerType',
              'tabTitleId': 'SNAPIN-TITLE'
            },
            {
              'snapInId': 'txt-view-comparison',
              'canLoseFocusOnPreselection': true,
              'typeId': 'TextualViewerType',
              'tabTitleId': 'SNAPIN-TITLE'
            }
          ],
          'panes': [
            {
              'snapInReferences': [
                {
                  'id': 'sys-brow',
                  'communicationRules': [
                    {
                      'destination': 'system-manager.primary-pane',
                      'hitRightPanel': true
                    },
                    {
                      'destination': 'system-manager.single-pane'
                    },
                    {
                      'destination': 'system-manager.comparison-pane',
                      'ruleName': 'SecondarySelection',
                      'canSwitchLayout': true
                    }
                  ],
                  'config': {
                    'enableValues': [
                      {
                        'enabled': false
                      }
                    ],
                    'postActiveView': true
                  }
                }
              ],
              'id': 'selection-pane',
              'titleVisible': true,
              'paneTitleOrSnapinTitle': 'snapin',
              'primaryHeader': false,
              'hasTab': false
            },
            {
              'snapInReferences': [
                {
                  'id': 'report-view',
                  'communicationRules': [
                    {
                      'hitRightPanel': true
                    }
                  ]
                },
                {
                  'id': 'trend',
                  'communicationRules': [
                    {
                      'hitRightPanel': true
                    }
                  ]
                },
                {
                  'id': 'log-viewer',
                  'communicationRules': [
                    {
                      'hitRightPanel': true
                    }
                  ]
                },
                {
                  'id': 'schedule',
                  'communicationRules': [
                    {
                      'hitRightPanel': true
                    }
                  ]
                },
                {
                  'id': 'document',
                  'communicationRules': [
                    {
                      'hitRightPanel': true
                    },
                    {
                      'destination': 'system-manager.selection-pane',
                      'ruleName': 'new-primary-selection'
                    }
                  ]
                },
                {
                  'id': 'graph',
                  'communicationRules': [
                    {
                      'hitRightPanel': true
                    },
                    {
                      'destination': 'system-manager.selection-pane',
                      'ruleName': 'new-primary-selection'
                    }
                  ]
                },
                {
                  'id': 'txt-view',
                  'communicationRules': [
                    {
                      'hitRightPanel': true
                    }
                  ]
                }
              ],
              'id': 'primary-pane',
              'hasTab': true,
              'canStartWithoutSelectedSnapin': true,
              'displaySelectedObject': true
            },
            {
              'snapInReferences': [
                {
                  'id': 'trend-comparison',
                  'communicationRules': [
                    {
                      'hitRightPanel': true
                    },
                    {
                      'destination': 'system-manager.comparison-pane',
                      'ruleName': 'new-primary-selection'
                    }
                  ],
                  'canSendToSelf': true
                },
                {
                  'id': 'schedule-comparison',
                  'communicationRules': [
                    {
                      'hitRightPanel': true
                    },
                    {
                      'destination': 'system-manager.comparison-pane',
                      'ruleName': 'new-primary-selection'
                    }
                  ],
                  'canSendToSelf': true
                },
                {
                  'id': 'document-comparison',
                  'communicationRules': [
                    {
                      'hitRightPanel': true
                    },
                    {
                      'destination': 'system-manager.comparison-pane',
                      'ruleName': 'new-primary-selection'
                    }
                  ],
                  'canSendToSelf': true
                },
                {
                  'id': 'graph-comparison',
                  'communicationRules': [
                    {
                      'hitRightPanel': true
                    },
                    {
                      'destination': 'system-manager.comparison-pane',
                      'ruleName': 'new-primary-selection'
                    }
                  ],
                  'canSendToSelf': true
                },
                {
                  'id': 'txt-view-comparison',
                  'communicationRules': [
                    {
                      'hitRightPanel': true
                    },
                    {
                      'destination': 'system-manager.comparison-pane',
                      'ruleName': 'new-primary-selection'
                    }
                  ],
                  'canSendToSelf': true
                }
              ],
              'id': 'comparison-pane',
              'primaryHeader': true,
              'hasTab': true,
              'closeButton': true,
              'paneTitleOrSnapinTitle': 'snapin',
              'canStartWithoutSelectedSnapin': true,
              'displaySelectedObject': true
            },
            {
              'snapInReferences': [
                {
                  'id': 'trend',
                  'communicationRules': [
                    {
                      'hitRightPanel': true
                    },
                    {
                      'destination': 'system-manager.selection-pane',
                      'ruleName': 'new-primary-selection'
                    },
                    {
                      'destination': 'system-manager.primary-pane',
                      'ruleName': 'new-primary-selection'
                    }
                  ]
                },
                {
                  'id': 'log-viewer',
                  'communicationRules': [
                    {
                      'hitRightPanel': true
                    },
                    {
                      'destination': 'system-manager.selection-pane',
                      'ruleName': 'new-primary-selection'
                    },
                    {
                      'destination': 'system-manager.primary-pane',
                      'ruleName': 'new-primary-selection'
                    }
                  ]
                },
                {
                  'id': 'schedule',
                  'communicationRules': [
                    {
                      'hitRightPanel': true
                    },
                    {
                      'destination': 'system-manager.selection-pane',
                      'ruleName': 'new-primary-selection'
                    },
                    {
                      'destination': 'system-manager.primary-pane',
                      'ruleName': 'new-primary-selection'
                    }
                  ]
                },
                {
                  'id': 'document',
                  'communicationRules': [
                    {
                      'hitRightPanel': true
                    },
                    {
                      'destination': 'system-manager.selection-pane',
                      'ruleName': 'new-primary-selection'
                    },
                    {
                      'destination': 'system-manager.primary-pane',
                      'ruleName': 'new-primary-selection'
                    }
                  ]
                },
                {
                  'id': 'graph',
                  'canSendToSelf': true,
                  'communicationRules': [
                    {
                      'hitRightPanel': true
                    },
                    {
                      'destination': 'system-manager.single-pane',
                      'ruleName': 'new-primary-selection'
                    },
                    {
                      'destination': 'system-manager.selection-pane',
                      'ruleName': 'new-primary-selection'
                    },
                    {
                      'destination': 'system-manager.primary-pane',
                      'ruleName': 'new-primary-selection'
                    }
                  ],
                  'config': {
                    'EnableAlarmIndication': true,
                    'AlarmIconSize': 16,
                    'EnableDownwardNavigation': false,
                    'IsSinglePane': true,
                    'avoidPreselectOnSecondarySelection': true
                  }
                },
                {
                  'id': 'txt-view',
                  'communicationRules': [
                    {
                      'hitRightPanel': true
                    }
                  ],
                  'config': {
                    'avoidPreselectOnSecondarySelection': true
                  }
                }
              ],
              'id': 'single-pane',
              'hasTab': true,
              'canStartWithoutSelectedSnapin': true,
              'displaySelectedObject': true
            }
          ],
          'rightPanelCommunications': [
            {
              'id': 'related-items',
              'communicationRules': [
                {
                  'ruleName': 'SecondarySelection',
                  'canSwitchLayout': true,
                  'destination': 'system-manager.comparison-pane',
                  'fallbackDestination': 'system-manager.primary-pane'
                },
                {
                  'destination': 'system-manager.primary-pane',
                  'hitRightPanel': true
                },
                {
                  'destination': 'system-manager.single-pane'
                }
              ]
            }
          ],
          'layoutInstances': [
            {
              'paneInstance': {
                'id': 'single-pane'
              },
              'id': '1-pane',
              'iconClass': 'element-layout-pane-1',
              'isDefault': true
            },
            {
              'splitter': {
                'id': 'selection-pane-splitter',
                'firstChild': {
                  'paneInstance': {
                    'id': 'selection-pane'
                  }
                },
                'secondChild': {
                  'paneInstance': {
                    'id': 'primary-pane'
                  }
                },
                'orientation': 'vertical',
                'firstChildSize': '340px'
              },
              'id': '2-pane',
              'iconClass': 'element-layout-pane-2',
              'isDefault': true
            },
            {
              'splitter': {
                'id': 'selection-pane-splitter',
                'firstChild': {
                  'paneInstance': {
                    'id': 'selection-pane'
                  }
                },
                'secondChild': {
                  'splitter': {
                    'id': 'comparison-pane-splitter',
                    'firstChild': {
                      'paneInstance': {
                        'id': 'primary-pane'
                      }
                    },
                    'secondChild': {
                      'paneInstance': {
                        'id': 'comparison-pane',
                        'whenClosed': '2-pane'
                      }
                    },
                    'orientation': 'vertical',
                    'firstChildSize': '50%',
                    'collapsingPane': 'second'
                  }
                },
                'orientation': 'vertical',
                'firstChildSize': '340px'
              },
              'id': '2-pane-comparison',
              'iconClass': 'element-layout-pane-4',
              'mediaQuery': 'only screen and (min-width:1360px)'
            }
          ],
          'qParamServices': [
            {
              'id': 'SystemQParamService',
              'primaryChannelId': 'primary',
              'channels': [
                {
                  'id': 'primary',
                  'communicationRules': [
                    {
                      'destination': 'system-manager.primary-pane',
                      'hitRightPanel': true
                    },
                    {
                      'destination': 'system-manager.single-pane'
                    },
                    {
                      'destination': 'system-manager.selection-pane',
                      'appliesOnLayoutIds': [
                        {
                          'id': '1-pane'
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ],
          'views': [
            {
              'id': 'tree-view',
              'viewLayouts': [
                {
                  'id': '1-pane'
                },
                {
                  'id': '2-pane'
                },
                {
                  'id': '2-pane-comparison'
                }
              ],
              'preferredSnapin': {
                'paneId': 'selection-pane',
                'snapinId': 'sys-brow'
              }
            },
            {
              'id': 'bim-view',
              'viewLayouts': [
                {
                  'id': '1-pane'
                },
                {
                  'id': '2-pane-bim'
                }
              ],
              'preferredSnapin': {
                'paneId': 'selection-pane',
                'snapinId': 'bim-viewer'
              }
            }
          ],
          'id': 'system-manager',
          'iconClass': 'element-list'
        }
      ],
      'primaryBarConfig': {
        'primaryItems': [
          {
            'id': 'system',
            'childrenIds': [
              {
                'id': 'system-manager'
              },
              {
                'id': 'bim-viewer-frame-id'
              }
            ]
          },
          {
            'id': 'events',
            'childrenIds': [
              {
                'id': 'event-list'
              }
            ]
          }
        ]
      },
      'verticalBarConfigs': [
        {
          'id': 'account-settings',
          'verticalBarItems': [
            {
              'id': 'Account',
              'icon': 'element-account',
              'value': 'account-frame-id'
            },
            {
              'id': 'Settings',
              'icon': 'element-settings',
              'verticalBarItems': [
                {
                  'id': 'Notification',
                  'value': 'notifconfig-frame-id'
                }
              ]
            }
          ]
        },
        {
          'id': 'system',
          'verticalBarItems': [
            {
              'id': 'Views',
              'icon': 'element-show',
              'hideFolderOnSingleEntry': true,
              'verticalBarItems': [
                {
                  'id': 'Tree-View',
                  'value': 'system-manager'
                },
                {
                  'id': '3D-View',
                  'value': 'bim-viewer-frame-id'
                }
              ]
            },
            {
              'id': 'Settings',
              'icon': 'element-settings',
              'verticalBarItems': [
                {
                  'id': 'Printer-Settings',
                  'value': 'print-settings'
                }
              ]
            }
          ]
        }
      ],
      'modes': [
        {
          'id': 'default',
          'isDefaultMode': true
        },
        {
          'id': 'investigative'
        }
      ]
    }
  }
;

export const HLDL_CLIENT_PROFILE_EXT_TEST_EXAMPLE: any = {
  'hfwExtension': {
    'parentProfile': 'DEFAULT.hldl.json',
    'hfwFrames': [
      {
        'id': EVENT_LIST,
        'panes': [
          {
            'snapInReferences': [
              {
                'id': 'el',
                'config': {
                  'confirmSubsequentsEventsCmds': true,
                  'columns': [
                    {
                      'name': 'eventIcon'
                    },
                    {
                      'name': 'groupButton'
                    },
                    {
                      'name': 'messageText'
                    }
                  ],
                  'sorting_criteria': [
                    {
                      'column_name': 'state',
                      'direction': 'Ascending'
                    },
                    {
                      'column_name': 'categoryDescriptor',
                      'direction': 'Ascending'
                    },
                    {
                      'column_name': 'creationTime',
                      'direction': 'Descending'
                    }
                  ]
                }
              }
            ],
            'id': 'el-pane'
          }
        ]
      }
    ]
  }
};

export const HLDL_EXTENSION_TEST_EXAMPLE: any = {
  'hfwExtension': {
    'snapInTypes': [
      {
        'typeId': 'EventDetailsType',
        'moduleURL': '@gms/event-details/bundles/gms-event-details.umd.min',
        'moduleName': 'GmsEventDetailsSnapInModule',
        'resourceFolder': '@gms/event-details/i18n/'
      }
    ],
    'hfwFrames': [
      {
        'snapInInstances': [
          {
            'snapInId': 'vid-view',
            'canLoseFocusOnPreselection': true,
            'typeId': 'EventDetailsType',
            'tabTitleId': SNAPIN_TITLE
          },
          {
            'snapInId': VID_VIEW_COMPARISION,
            'canLoseFocusOnPreselection': true,
            'typeId': 'EventDetailsType',
            'tabTitleId': SNAPIN_TITLE
          }
        ],
        'panes': [
          {
            'snapInReferences': [
              {
                'id': 'vid-view',
                'order': '4',
                'communicationRules': [
                  {
                    'hitRightPanel': true
                  },
                  {
                    'destination': SYSTEM_MNGT,
                    'ruleName': NEW_PRIMARY_SELECTION
                  }
                ]
              }
            ],
            'id': PRIMARY_PANE
          },
          {
            'snapInReferences': [
              {
                'id': VID_VIEW_COMPARISION,
                'order': '4',
                'communicationRules': [
                  {
                    'hitRightPanel': true
                  }
                ]
              }
            ],
            'id': COMPARISON_PANE
          }
        ],
        'id': SYSTEM_MANAGER
      }
    ]
  }
};

export const HLDL_EXTENSION_TEST_EXAMPLE_2: any = {
  'hfwExtension': {
    'snapInTypes': [
      {
        'typeId': 'TrendSnapInType',
        'messageTypes': [
          {
            'name': 'FakeMT'
          }]
      }
    ],
    'hfwFrames': [
      {
        'panes': [
          {
            'snapInReferences': [
              {
                'id': 'trend',
                'communicationRules': [
                  {
                    'destination': SM_COMPARISON_PANE
                  }
                ]
              }
            ],
            'id': PRIMARY_PANE
          }
        ],
        'layoutInstances': [
          {
            'paneInstance': {
              'id': PRIMARY_PANE
            },
            'id': 'fake-layout',
            'iconClass': ELEMENT_LAYOUT_PANE_1
          }],
        'modes': [{
          'id': 'default',
          'isDefaultMode': true,
          'availableLayoutIds': [

            {
              'id': '2-pane'
            }
          ]
        },
        {
          'id': 'engineering',
          'availableLayoutIds': [
            {
              'id': '3-pane'
            }
          ],
          'deeplinkMasterId': 'sys-brow',
          'deeplinkSubscribers': [
            { 'id': 'trend' },
            { 'id': 'schedule' }
          ],
          'selectionMasterSnapInId': 'sys-brow'
        }],
        'id': SYSTEM_MANAGER
      }
    ]
  }
};
