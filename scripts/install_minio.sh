wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
./mc alias set myminio https://api.minio.pokorny.wien IGMH1IAN3w2MFqXT ioqVo7XnOq5a542kJ5uSDGi3DljlM29N

# Create bucket

./mc mb myminio/artellitext

# Create policy

./mc admin policy create myminio artellitext-rw artellitext-rw-policy.json

# Create user and attach policy

./mc admin user add myminio artellitext-user artellitext-user-secret
./mc admin policy attach myminio artellitext-rw --user artellitext-user