"""Handles a connecton to an S3 bucket to send Report data."""

# from boto3.s3.transfer import S3Transfer
import aiobotocore
import glob
import mimetypes
import os
import sys

from streamlit import config

# import shutil
# import time
# import hashlib
# import base64
# import time
#
# from google.cloud import storage
# from streamlit.util import get_local_id

#
# def calculate_hash(filename):
#     return '<REMVOE THIS FUNCTION>'
#     binary_hash = hashlib.md5(open(filename,'rb').read()).digest()
#     return base64.b64encode(binary_hash).decode("utf-8")
#
#
# def upload_blobs(blobs):
#     for filename, blob in blobs.items():
#         blob.upload_from_filename(filename)
#         blob.make_public()
#         print(filename)
#
# def upload_s3(s3, files):
#     for filename, location in files.items():
#         s3.put_object(Body=open(filename,'rb').read(), Bucket='streamlit-test9', Key=location, ACL='public-read')
#         print(filename)

class S3Connection:
    """Handles a connecton to an S3 bucket to send Report data."""

    def __init__(self):
        # # #self._uuid_user = uuid_user()
        # # # self._client = storage.Client()
        # # # self._bucketname = 'streamlit-gcs-test'
        # # self._local_id = str(get_local_id())
        # # self._ts = str(time.time())
        # #
        # # # if not self._client.lookup_bucket(self._bucketname):
        # # #     self._client.create_bucket(self._bucketname)
        # # #     self._bucket.configure_website('index.html')
        # # #     self._bucket.make_public(recursive=True, future=True)
        # #
        # # # self._bucket = self._client.get_bucket(self._bucketname)
        #
        # # dirname = os.path.dirname(os.path.normpath(__file__))
        # # basedir = dirname  # os.path.normpath(os.path.join(dirname, '..'))
        # # static_root = os.path.join(basedir, 'static')
        # # print('static_root', static_root)
        # # print('staticRoot', )
        # # sys.exit(-1)
        #
        # self._has_static_files = False
        #
        # if not self._has_static_files:
        #     static_root = config.get_path('proxy.staticRoot')
        #     dirs = []
        #     filenames = []
        #     for filename in glob.iglob(os.path.join(static_root, '**'), recursive=True):
        #         if os.path.isfile(filename):
        #             filenames.append(os.path.relpath(filename, static_root))
        #         if os.path.isdir(filename):
        #             dirs.append(os.path.relpath(filename, static_root))
        #
        # if not filenames:
        #     print("No static files in {}".format(static_root))
        #     sys.exit(1)
        # #
        # # # blobs = {x.name: x.md5_hash for x in self._bucket.list_blobs()}
        # files = {x: calculate_hash(os.path.join(static_root, x)) for x in filenames}
        # # #
        # upload = files.keys()
        # # # upload = [x for x in set(files.keys()) - set(blobs.keys())]
        # # # common = [x for x in set(blobs.keys()) & set(files.keys())]
        # # # for f in common:
        # # #     filename = os.path.join(static_root, f)
        # # #     hash = files[f]
        # # #     upload_hash = blobs[f]
        # # #     if hash != upload_hash:
        # # #         upload.append(f)
        # # #
        # # # blobs = {}
        # # # for f in upload:
        # # #     blob = self._bucket.blob(os.path.join(self._local_id, self._ts, f))
        # # #     filename = os.path.join(static_root, f)
        # # #     blobs[filename] = blob
        # # # self._blobs = blobs
        # #
        # self._stuffs = {}
        # for f in upload:
        #     path  = os.path.join(f)
        #     filename = os.path.join(static_root, f)
        #     self._stuffs[filename] = path
        # print('THESE ARE THE STUFFS:')
        # for k, v in self._stuffs.items():
        #     print('-', k, v)
        # sys.exit(-1)


        # THIS IS THE GOOD STUFF
        # self._s3 = boto3.client('s3')
        self._bucket = 'streamlit-test10'
        # self._transfer = S3Transfer(self._s3)
        # pass

#        upload_blobs(blobs)
    # def upload_static(self):
    #     #upload_blobs(self._blobs)
    #     upload_s3(self._s3, self._stuffs)

    # def local_save(self, data):
    #         filename = os.path.join(self._session_dir, str(time.time()) + '.data')
    #         print(filename)
    #
    #         with open(filename, 'wb') as f:
    #             f.write(data)
    #
    #         print('Wrote {}'.format(filename))

    async def upload_report(self, report_id, serialized_deltas):
        """Saves this report to our s3 bucket."""
        print('Got into upload_report (ASYNC DEF VERSION!)')

        # # Function to store data in the s3 bucket
        # def put_object(data, location):
        #     self._s3.put_object(Body=data, Bucket=self._bucket,
        #         Key=location, ACL='public-read')

        # All files in this bundle will be saved in this path.
        cloud_root = config.get_option('cloud.staticSaveRoot')
        save_root = os.path.join(cloud_root, report_id)

        # Save all the files in the static directory (excluding map files.)
        static_root = config.get_path('proxy.staticRoot')
        all_files = glob.iglob(os.path.join(static_root, '**'), recursive=True)
        session = aiobotocore.get_session()
        async with session.create_client('s3') as client:
            for load_filename in all_files:
                if not os.path.isfile(load_filename):
                    continue
                if load_filename.endswith('.map'):
                    continue
                relative_filename = os.path.relpath(load_filename, static_root)
                save_filename = os.path.join(save_root, relative_filename)
                # self._upload_file(load_filename, save_filename)
                # resp = await client.upload_file(load_filename, self._bucket, save_filename)
                # def callback(*args, **kwargs):
                #     print('CALLBACK', args, kwargs)
                mime_type = mimetypes.guess_type(load_filename)[0]
                if not mime_type:
                    mime_type = 'application/octet-stream'
                print(f'The mime type for "{load_filename}" is "{mime_type}".')
                with open(load_filename, 'rb') as input:
                    data = input.read()
                    resp = await client.put_object(Bucket=self._bucket, Key=save_filename,
                        Body=data, ContentType=mime_type, ACL='public-read')
                    # print(resp)
                    print(load_filename, '->', save_filename)

                    # test to see if the file exists
                    file_exists = False
                    response = await client.list_objects_v2(Bucket=self._bucket, Prefix=save_filename)
                    print('Looking for key and got', response)
                    for obj in response.get('Contents', []):
                        if obj['Key'] == save_filename:
                            print('Found the object with size', obj['Size'])
                            file_exists = True
                            break
                    print('Found the object:', file_exists)
                    print()

            print('ABOUT TO UPLOAD THE DELTAS')
            delta_filename = os.path.join(save_root, 'deltas.protobuf')
            try:
                await client.put_object(Bucket=self._bucket, Key=delta_filename,
                    Body=serialized_deltas, ContentType='application/octet-stream',
                    ACL='public-read')
            except Exception as e:
                print('GOT EXCEPTION', e)

            print('Finished saving.')
            print('upload_report done', report_id, type(serialized_deltas))
        # print('save to', save_root)

        # location = os.path.join(self._local_id, self._ts, 'data.pb')
        #
        # path = os.path.join(self._local_id, self._ts, 'index.html')
        # print("https://s3-us-west-2.amazonaws.com/streamlit-test9/" + path)

    # def _file_exists_on_s3(self, filename):
    #     """Returns a True iff the key exists in S3."""
    #     synchronous_s3 = boto3.resource('s3')
    #     bucket = client.Bucket(self._bucket)
    #     print('Got bucket:', bucket)
    #     objs = list(bucket.objects.filter(Prefix=filename))
    #     return len(objs) > 0 and objs[0].key == filename

    def _upload_file(self, load_filename, save_filename):
        """Uploads the file to the given s3 bucket."""
        # Figure out the MIME type
        mime_type = mimetypes.guess_type(load_filename)[0]
        if not mime_type:
            mime_type = 'application/octet-stream'
        print(f'The mime type for "{load_filename}" is "{mime_type}".')

        print('About to upload', load_filename)
        self._transfer.upload_file(load_filename, self._bucket, save_filename,
            extra_args={'ContentType': mime_type, 'ACL': 'public-read'})
        print('Finished uploading', save_filename)
