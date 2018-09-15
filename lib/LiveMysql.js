import Future from 'fibers/future';
import LiveMysqln from 'mysql-live-select';

class LiveMysql extends LiveMysqln {
  constructor() {
    super();
	  const self = this;
	  const fut = new Future;
	  let initLength;
  }
}

class _publishCursor extends LiveMysql{
	constructor(sub, fut) {
		super(sub);

		sub.onStop(() => {
			self.stop();
		});

		// Send reset message (for code pushes)
		sub._session.send({
			msg: 'added',
			collection: sub._name,
			id: sub._subscriptionId,
			fields: { reset: true }
		});

		// Send aggregation of differences
		self.on('update', (diff, rows) => {
			sub._session.send({
				msg: 'added',
				collection: sub._name,
				id: sub._subscriptionId,
				fields: { diff }
			});

			if(sub._ready === false && !fut.isResolved()){
				fut['return']();
			}
		});
		self.on('error', error => {
			if (!fut.isResolved()) {
				fut['throw'](error);
			}
			return fut.wait();
		});
	}
}

class LiveMysqlSelect extends  LiveMysql {
  constructor() {
    super();
    self = this;
	  this._cursorDescription = { collectionName: 'data' };
  }
  fetch() {
	  const dataWithIds = self.queryCache.data.map((row, index) => {
		  const clonedRow = _.clone(row);
		  if(!('_id' in clonedRow)) {
			  clonedRow._id = String('id' in clonedRow ? clonedRow.id : index + 1);
		  }

		  // Ensure row index is included since response will not be ordered
		  if(!('_index' in clonedRow)) {
			  clonedRow._index = index + 1;
		  }

		  return clonedRow;
	  });

	  return dataWithIds;
  }
}

