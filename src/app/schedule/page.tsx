
import { NextPage } from 'next';

interface Event {
  name: string;
  departments: string[];
  location: string;
  time: string;
  date: string;
  status: 'upcoming' | 'ongoing' | 'finished';
}

const events: Event[] = [
  {
    name: 'Event 1',
    departments: ['Department A', 'Department B'],
    location: 'Location 1',
    time: '10:00 AM',
    date: '2025-09-01',
    status: 'upcoming',
  },
  {
    name: 'Event 2',
    departments: ['Department C', 'Department D'],
    location: 'Location 2',
    time: '02:00 PM',
    date: '2025-09-01',
    status: 'ongoing',
  },
  {
    name: 'Event 3',
    departments: ['Department E', 'Department F'],
    location: 'Location 3',
    time: '04:00 PM',
    date: '2025-09-01',
    status: 'finished',
  },
];

const SchedulePage: NextPage = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-ndmc-green mb-2">🗓️ Schedule</h1>
        <p className="text-gray-600">Upcoming, ongoing, and finished events</p>
      </div>

      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="table-header">
              <tr>
                <th className="table-cell text-left font-semibold">Event Name</th>
                <th className="table-cell text-left font-semibold">Competing Departments</th>
                <th className="table-cell text-left font-semibold">Location</th>
                <th className="table-cell text-left font-semibold">Time</th>
                <th className="table-cell text-left font-semibold">Date</th>
                <th className="table-cell text-center font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, index) => (
                <tr key={index} className="table-row animate-fadeIn">
                  <td className="table-cell">{event.name}</td>
                  <td className="table-cell">{event.departments.join(', ')}</td>
                  <td className="table-cell">{event.location}</td>
                  <td className="table-cell">{event.time}</td>
                  <td className="table-cell">{event.date}</td>
                  <td className="table-cell text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-white ${
                        event.status === 'upcoming'
                          ? 'bg-yellow-500'
                          : event.status === 'ongoing'
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      }`}
                    >
                      {event.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SchedulePage;
