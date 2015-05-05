import MessagePacker from './message-packer';

class MockDataView {
  constructor () { }

  setInt8 () { }
  setUint8 () { }
  setInt16 () { }
  setUint16 () { }
  setInt32 () { }
  setUint32 () { }
  setFloat32 () { }
  setFloat64 () { }
}

class MessageScale extends MessagePacker {
  constructor () {
    super();
    this.$dv = new MockDataView();
  }
}

export default MessageScale;
