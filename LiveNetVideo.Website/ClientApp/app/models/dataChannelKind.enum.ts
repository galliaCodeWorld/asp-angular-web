export enum DataChannelKind {
	name = "DataChannelKind",

	// NOTE: DataChannelKind are the different datachannels
	// the application will have

	// for sending general json string which will then be converted to objects
	// on the other side
	dcJsonType = "dcJsonType",

	// for sending binary data such as files
	dcBinaryType = "dcBinaryType"
}