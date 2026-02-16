'use client';

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useEffect, useState } from 'react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface DiscountChartProps {
  results: Array<{ calculatedDiscount: number }>;
}

export default function DiscountChart({ results }: DiscountChartProps) {
  // Kelompokkan diskon ke dalam interval (misal 0-10, 10-20, ...)
  const intervals = ['0-10%', '10-20%', '20-30%', '30-40%', '40-50%', '50%+'];
  const counts = [0, 0, 0, 0, 0, 0];

  results.forEach(r => {
    const d = r.calculatedDiscount;
    if (d < 10) counts[0]++;
    else if (d < 20) counts[1]++;
    else if (d < 30) counts[2]++;
    else if (d < 40) counts[3]++;
    else if (d < 50) counts[4]++;
    else counts[5]++;
  });

  const data = {
    labels: intervals,
    datasets: [
      {
        label: 'Jumlah Perhitungan',
        data: counts,
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
  };

  return <Bar data={data} options={options} />;
}