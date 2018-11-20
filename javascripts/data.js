
var mainUnits = [
  {
    department: "R&D Dept. 54 employees 19 approvals",
    approvers: [
      {
        approverName: "Billie Hollins",
        approverTotalValue: 0,
        approvalTypes: [
          {
            label: "Purchase Orders",
            average: 240,
            averageLabel: "9.5 Days",
            approvals: [
              {waitTime: 10, value: 64000},
              {waitTime: 20, value: 32000},
              {waitTime: 43, value: 64000},
              {waitTime: 80, value: 64000},
              {waitTime: 92, value: 320000},
              {waitTime: 130, value: 8000},
              {waitTime: 180, value: 120000},
              {waitTime: 280, value: 320000},
              {waitTime: 450, value: 64000},
            ],
          },
          {
            label: "Expenses",
            average: 200,
            averageLabel: "5.2 Days",
            approvals: [
              {waitTime: 15, value: 64000},
              {waitTime: 33, value: 32000},
              {waitTime: 50, value: 64000},
              {waitTime: 80, value: 64000},
              {waitTime: 120, value: 320000},
              {waitTime: 160, value: 8000},
              {waitTime: 340, value: 120000},
              {waitTime: 400, value: 320000},
              {waitTime: 520, value: 64000},
            ],
          },
        ],
      }
    ],
  },
  {
    department: "Customer Success Dept. 34 employees 145 approvals",
    approvers: [
      {
        approverName: "Sam Abbasi",
        approverTotalValue: 0,
        approvalTypes: [
          {
            label: "Purchase Orders",
            average: 240,
            averageLabel: "9.5 Days",
            approvals: [
              {waitTime: 10, value: 64000},
              {waitTime: 20, value: 32000},
              {waitTime: 43, value: 64000},
              {waitTime: 80, value: 64000},
              {waitTime: 130, value: 8000},
              {waitTime: 180, value: 120000},
              {waitTime: 280, value: 320000},
              {waitTime: 450, value: 64000},
            ],
          },
        ],
      },
      {
        approverName: "Catarina Cota",
        approverTotalValue: 0,
        approvalTypes: [
          {
            label: "Purchase Requests",
            average: 170,
            averageLabel: "9.5 Days",
            approvals: [
              {waitTime: 10, value: 64000},
              {waitTime: 20, value: 32000},
              {waitTime: 43, value: 33000},
              {waitTime: 80, value: 18000},
              {waitTime: 90, value: 50000},
              {waitTime: 95, value: 12000},
              {waitTime: 116, value: 64000},
              {waitTime: 130, value: 8000},
              {waitTime: 180, value: 120000},
              {waitTime: 280, value: 320000},
            ],
          },
        ],
      },
      {
        approverName: "Esmail Mazza",
        approverTotalValue: 0,
        approvalTypes: [
          {
            label: "Vendor On-boarding",
            average: 170,
            averageLabel: "6 Days",
            approvals: [
              {waitTime: 170, value: 30000},
              {waitTime: 220, value: 60000},
              {waitTime: 240, value: 36000},
            ],
          },
        ],
      },
    ],
  },
  {
    department: "Marketing Dept. 26 employees 25 approvals",
    approvers: [
      {
        approverName: "Perikilis Nazario",
        approverTotalValue: 4600000,
        approvalTypes: [
          {
            label: "Campaign Invoices",
            average: 300,
            averageLabel: "6.3 Days",
            approvals: [
              {waitTime: 10, value: 64000},
              {waitTime: 20, value: 32000},
              {waitTime: 80, value: 64000},
              {waitTime: 92, value: 320000},
              {waitTime: 130, value: 8000},
              {waitTime: 450, value: 64000},
            ],
          },
          {
            label: "Expenses",
            average: 150,
            averageLabel: "3.7 Days",
            approvals: [
              {waitTime: 15, value: 64000},
              {waitTime: 33, value: 32000},
              {waitTime: 47, value: 32000},
              {waitTime: 50, value: 64000},
              {waitTime: 80, value: 64000},
              {waitTime: 120, value: 320000},
              {waitTime: 340, value: 120000},
              {waitTime: 400, value: 320000},
            ],
          },
          {
            label: "Vendor Payment",
            average: 320,
            averageLabel: "10.8 Days",
            approvals: [
              {waitTime: 90, value: 64000},
              {waitTime: 120, value: 320000},
              {waitTime: 340, value: 120000},
              {waitTime: 400, value: 320000},
            ],
          },
        ],
      }
    ],
  },
];

function calculateTotalValues(originalData) {
  originalData.forEach(function(unit) {
    unit.approvers.forEach(function(approver) {
      approver.approverTotalValue = approver.approvalTypes.reduce(function(b, approvalType) {
        return b + approvalType.approvals.reduce(function(c, approval) {
          return c + approval.value;
        }, 0);
      }, 0);
    });
  });
}

calculateTotalValues(mainUnits);

function filterDataByCriteria(originalData, criteria) {
  // criteria {totalValueMin, totalValueMax, waitTimeMin, waitTimeMax}
  var filteredMainUnits = JSON.parse(JSON.stringify(originalData));

  if (criteria.totalValueMin !== null) {
    filteredMainUnits = filteredMainUnits.filter(function (o) {
      return o.approvers.some(function(approver) {
        return approver.approverTotalValue >= criteria.totalValueMin && approver.approverTotalValue <= criteria.totalValueMax;
      });
    });

    filteredMainUnits.forEach(function(unit) {
      unit.approvers = unit.approvers.filter(function(approver) {
        return approver.approverTotalValue >= criteria.totalValueMin && approver.approverTotalValue <= criteria.totalValueMax;
      });
    });
  }

  if (criteria.waitTimeMin !== null) {
    filteredMainUnits.forEach(function(unit) {
      unit.approvers.forEach(function(approver) {
        approver.approvalTypes.forEach(function(approvalType) {
          approvalType.approvals = approvalType.approvals.filter(function(approval) {
            return approval.waitTime >= criteria.waitTimeMin && approval.waitTime <= criteria.waitTimeMax;
          })
        })
      })
    });

    filteredMainUnits.forEach(function(unit) {
      unit.approvers.forEach(function(approver) {
        approver.approvalTypes = approver.approvalTypes.filter(function(approvalType) {
          return approvalType.approvals.length > 0;
        })
      })
    });

    filteredMainUnits.forEach(function(unit) {
      unit.approvers = unit.approvers.filter(function(approver) {
        return approver.approvalTypes.length > 0;
      });
    });

    filteredMainUnits = filteredMainUnits.filter(function(unit) {
      return unit.approvers.length > 0;
    });
  }

  return filteredMainUnits;
}
