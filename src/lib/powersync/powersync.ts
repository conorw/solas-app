import { column, Schema, Table } from '@powersync/web';
// OR: import { column, Schema, Table } from '@powersync/react-native';

const service = new Table(
  {
    // id column (text) is automatically included
    "Auto ID": column.integer,
    Name: column.text,
    "Is Current": column.integer,
    "Created At": column.text,
    "Updated At": column.text,
    Multi: column.integer
  },
  { indexes: {} }
);

const attendance = new Table(
  {
    // id column (text) is automatically included
    Date: column.text,
    "Person Id": column.integer,
    "Person Name": column.text,
    "ServiceName": column.text,
    "Auto ID": column.integer,
    "Created At": column.text,
    "Updated At": column.text,
    TotalAttendees: column.text,
    Multi: column.integer
  },
  { indexes: {} }
);

const people = new Table(
  {
    // id column (text) is automatically included
    "Auto ID": column.integer,
    LastName: column.text,
    FirstName: column.text,
    DateOfBirth: column.text,
    "Acupuncture Data": column.integer
  },
  { indexes: {} }
);

export const AppSchema = new Schema({
  service,
  attendance,
  people
});

export type Database = (typeof AppSchema)['types'];
